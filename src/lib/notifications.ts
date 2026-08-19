import { prisma } from "./db";
import { notify } from "./audit";

export async function sendNotification(opts: Parameters<typeof notify>[0]) {
  return notify(opts);
}

export async function sendEmail(_to: string, _subject: string, _body: string) {
  // Integration point: connect SMTP / Resend here.
  return { queued: false, provider: "stub" as const };
}

export async function sendSMS(_to: string, _body: string) {
  // Integration point: connect Africa's Talking / Twilio here.
  return { queued: false, provider: "stub" as const };
}

export async function sendWhatsApp(_to: string, _body: string) {
  // Integration point: connect WhatsApp Business API here.
  return { queued: false, provider: "stub" as const };
}

export async function runMorningJobs() {
  const now = new Date();
  const soon30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const overdue = await prisma.invoice.findMany({
    where: {
      status: { in: ["pending", "partially_paid", "overdue"] },
      dueDate: { lt: now },
    },
    include: { patient: true },
  });
  for (const inv of overdue) {
    if (inv.status !== "overdue") {
      await prisma.invoice.update({ where: { id: inv.id }, data: { status: "overdue" } });
    }
    const balance = inv.totalCents - inv.paidCents;
    if (balance > 0) {
      await notify({
        clinicId: inv.clinicId,
        type: "invoice_overdue",
        title: "Payment overdue",
        body: `${inv.patient.fullName} has an outstanding invoice ${inv.invoiceNumber}.`,
        relatedUrl: `/app/billing/invoices/${inv.id}`,
      });
    }
  }

  const expiring = await prisma.inventoryBatch.findMany({
    where: { expiryDate: { lte: soon30, gte: now }, quantity: { gt: 0 } },
    include: { product: true },
  });
  for (const b of expiring) {
    await notify({
      clinicId: b.clinicId,
      type: "medicine_expiring",
      title: "Medicine expiring",
      body: `${b.product.name} batch ${b.batchNumber} expires soon.`,
      relatedUrl: "/app/inventory/expiry",
    });
  }

  const products = await prisma.product.findMany({ include: { batches: true } });
  for (const p of products) {
    const qty = p.batches.reduce((s, b) => s + b.quantity, 0);
    if (qty <= p.minQty) {
      await notify({
        clinicId: p.clinicId,
        type: "low_stock",
        title: "Low stock",
        body: `${p.name} is below minimum stock.`,
        relatedUrl: "/app/inventory/low-stock",
      });
    }
  }
}
