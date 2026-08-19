import { requireUser } from "@/lib/auth";
import { getSelectedClinicId } from "@/lib/scope";
import { dashboardMetrics, clinicPerformance } from "@/lib/metrics";
import { ksh } from "@/lib/money";
import { Card, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";

export default async function BusinessPage() {
  await requireUser();
  const user = await requireUser();
  const clinicId = await getSelectedClinicId(user);
  const m = await dashboardMetrics(clinicId);
  const rows = await clinicPerformance();
  const top = rows.sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  return (
    <div>
      <SectionBanner
        image="billingDesk"
        title="Business overview"
        subtitle="Revenue, collections and inventory value across your healthcare group."
        height="sm"
      />
      <PageHeader title="Business Overview" subtitle="How is the healthcare group performing?" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Revenue", ksh(m.totalRevenue)],
          ["Expenses", ksh(m.expenses)],
          ["Net", ksh(m.net)],
          ["Outstanding", ksh(m.outstanding)],
          ["Patients", String(m.patients)],
          ["Inventory value", ksh(m.inventoryValue)],
          ["Collection rate", `${m.collectionRate}%`],
          ["Top clinic", top?.clinic.name || "—"],
        ].map(([t, v]) => (
          <Card key={t}>
            <p className="text-sm text-muted">{t}</p>
            <p className="mt-2 text-xl font-semibold">{v}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
