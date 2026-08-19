import { requireUser } from "@/lib/auth";
import { getSelectedClinicId } from "@/lib/scope";
import { dashboardMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/db";
import { ksh } from "@/lib/money";
import { Card, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { ClinicBars, Donut, RevenueLine } from "@/components/charts";
import { format } from "date-fns";
import { dashboardTitle } from "@/lib/status";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();
  const clinicId = await getSelectedClinicId(user);
  const m = await dashboardMetrics(clinicId);

  const byDay = Array.from({ length: 14 }).map((_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - i));
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const amount = m.payments.filter((p) => p.createdAt >= day && p.createdAt < next).reduce((s, p) => s + p.amountCents, 0) / 100;
    return { day: format(day, "dd MMM"), amount };
  });

  const clinics = await prisma.clinic.findMany();
  const clinicBars = await Promise.all(
    clinics.map(async (c) => {
      const cm = await dashboardMetrics(c.id);
      return { name: c.name.replace("Aether ", ""), revenue: cm.totalRevenue / 100 };
    }),
  );

  const statusCounts = await prisma.appointment.groupBy({
    by: ["status"],
    where: clinicId ? { clinicId } : {},
    _count: true,
  });

  const kpis = [
    ["Total Revenue", ksh(m.totalRevenue)],
    ["Today's Revenue", ksh(m.todayRevenue)],
    ["Outstanding", ksh(m.outstanding)],
    ["Patients", String(m.patients)],
    ["Today's Appointments", String(m.todayAppts)],
    ["Completed", String(m.completed)],
    ["Pending", String(m.pending)],
    ["Low Stock", String(m.lowStock)],
    ["Expiring Medicines", String(m.expiring)],
  ];

  return (
    <div>
      <SectionBanner
        image="clinicInterior"
        title={dashboardTitle(user.role)}
        subtitle="Live operations across appointments, collections, patients and stock."
        height="sm"
      />
      <PageHeader title={dashboardTitle(user.role)} subtitle="Live metrics from clinic records — not placeholders." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(([t, v]) => (
          <Card key={t}>
            <p className="text-sm text-muted">{t}</p>
            <p className="mt-2 text-2xl font-semibold">{v}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold">Daily revenue</h3>
          <RevenueLine data={byDay} />
        </Card>
        <Card>
          <h3 className="mb-3 font-semibold">Revenue by clinic</h3>
          <ClinicBars data={clinicBars} />
        </Card>
        <Card>
          <h3 className="mb-3 font-semibold">Appointment status</h3>
          <Donut data={statusCounts.map((s) => ({ name: s.status, value: s._count }))} />
        </Card>
        <Card>
          <h3 className="mb-3 font-semibold">Expected vs actual</h3>
          <p className="text-sm text-muted">Expected {ksh(m.expected)} · Collected {ksh(m.actual)} · Outstanding {ksh(m.outstanding)}</p>
          <p className="mt-4 text-4xl font-semibold">{m.collectionRate}%</p>
          <p className="text-sm text-muted">collection rate</p>
        </Card>
      </div>
      {user.role === "Receptionist" ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["/app/patients/new", "REGISTER PATIENT"],
            ["/app/appointments/new", "BOOK APPOINTMENT"],
            ["/app/appointments/today", "CHECK IN / TODAY"],
            ["/app/billing/outstanding", "COLLECT PAYMENT"],
            ["/app/pos", "NEW SALE"],
            ["/app/appointments/today", "TODAY'S APPOINTMENTS"],
          ].map(([href, label]) => (
            <Link key={label} href={href} className="rounded-2xl bg-accent px-4 py-6 text-center text-sm font-bold text-white">
              {label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
