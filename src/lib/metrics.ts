import { prisma } from "./db";
import { clinicWhere } from "./scope";

export async function dashboardMetrics(clinicId: string | null) {
  const where = clinicWhere(clinicId);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const payments = await prisma.payment.findMany({
    where: { ...where, status: "completed" },
    select: { amountCents: true, createdAt: true, method: true, clinicId: true },
  });
  const totalRevenue = payments.reduce((s, p) => s + p.amountCents, 0);
  const todayRevenue = payments.filter((p) => p.createdAt >= start && p.createdAt < end).reduce((s, p) => s + p.amountCents, 0);

  const invoices = await prisma.invoice.findMany({
    where: { ...where, status: { notIn: ["cancelled", "draft"] } },
  });
  const expected = invoices.reduce((s, i) => s + i.totalCents, 0);
  const outstanding = invoices.reduce((s, i) => s + Math.max(0, i.totalCents - i.paidCents), 0);

  const [patients, todayAppts, completed, pending] = await Promise.all([
    prisma.patient.count({ where: { ...where, archived: false } }),
    prisma.appointment.count({ where: { ...where, startAt: { gte: start, lt: end }, archived: false } }),
    prisma.appointment.count({ where: { ...where, startAt: { gte: start, lt: end }, status: "completed" } }),
    prisma.appointment.count({ where: { ...where, status: { in: ["pending", "confirmed"] }, archived: false } }),
  ]);

  const products = await prisma.product.findMany({ where, include: { batches: true } });
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 86400000);
  let lowStock = 0;
  let expiring = 0;
  let inventoryValue = 0;
  for (const p of products) {
    const qty = p.batches.reduce((s, b) => s + b.quantity, 0);
    inventoryValue += qty * p.purchaseCents;
    if (qty <= p.minQty) lowStock++;
    if (p.batches.some((b) => b.expiryDate && b.expiryDate <= soon && b.expiryDate >= now && b.quantity > 0)) expiring++;
  }

  const expenses = await prisma.expense.aggregate({ where, _sum: { amountCents: true } });

  return {
    totalRevenue,
    todayRevenue,
    outstanding,
    expected,
    actual: totalRevenue,
    collectionRate: expected ? Math.round((totalRevenue / expected) * 100) : 0,
    patients,
    todayAppts,
    completed,
    pending,
    lowStock,
    expiring,
    inventoryValue,
    expenses: expenses._sum.amountCents || 0,
    net: totalRevenue - (expenses._sum.amountCents || 0),
    payments,
  };
}

export async function clinicPerformance() {
  const clinics = await prisma.clinic.findMany({ where: { isActive: true } });
  const rows = [];
  for (const c of clinics) {
    const m = await dashboardMetrics(c.id);
    const appts = await prisma.appointment.count({ where: { clinicId: c.id } });
    const cancelled = await prisma.appointment.count({ where: { clinicId: c.id, status: "cancelled" } });
    const medicineSales = await prisma.sale.aggregate({ where: { clinicId: c.id }, _sum: { totalCents: true } });
    rows.push({
      clinic: c,
      ...m,
      appointments: appts,
      cancellationRate: appts ? Math.round((cancelled / appts) * 100) : 0,
      medicineSales: medicineSales._sum.totalCents || 0,
    });
  }
  return rows;
}
