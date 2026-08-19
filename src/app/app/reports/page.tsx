import { requirePermission } from "@/lib/auth";
import { getSelectedClinicId } from "@/lib/scope";
import { dashboardMetrics } from "@/lib/metrics";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { PdfDownloadButton } from "@/components/pdf-download-button";
import { PrintButton } from "@/components/print-button";
import { ksh } from "@/lib/money";
import { format } from "date-fns";
import Link from "next/link";

export default async function Reports() {
  const user = await requirePermission("reports.view");
  const clinicId = await getSelectedClinicId(user);
  const m = await dashboardMetrics(clinicId);
  const methods = await prisma.payment.groupBy({
    by: ["method"],
    where: { status: "completed", ...(clinicId ? { clinicId } : {}) },
    _sum: { amountCents: true },
  });
  const when = format(new Date(), "dd MMM yyyy HH:mm");
  const pdfLines = [
    { label: "Revenue", amount: ksh(m.totalRevenue) },
    { label: "Outstanding", amount: ksh(m.outstanding) },
    { label: "Inventory value", amount: ksh(m.inventoryValue) },
    ...methods.map((x) => ({ label: `Payments · ${x.method}`, amount: ksh(x._sum.amountCents || 0) })),
  ];
  return (
    <div>
      <SectionBanner
        image="billingDesk"
        title="Reporting center"
        subtitle="Export live financial and patient summaries without leaving the platform."
        height="sm"
      />
      <PageHeader title="Reports" subtitle="Financial, patient, inventory and staff summaries from live data." />
      <div className="mb-4 flex flex-wrap gap-2 no-print">
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/api/export/payments.csv">Export payments CSV</Link>
        <Link className="rounded-xl border px-3 py-2 text-sm" href="/api/export/patients.csv">Export patients CSV</Link>
        <PrintButton className="no-print" />
        <PdfDownloadButton
          title="Operations summary"
          subtitle={`Generated ${when}${clinicId ? " · selected clinic" : " · all clinics"}`}
          lines={pdfLines}
          footer="Aether Clinics — internal report. Do not share patient identifiers outside authorized staff."
          fileName={`aether-report-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`}
          className="no-print"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card><p className="text-sm text-muted">Revenue</p><p className="text-2xl font-semibold">{ksh(m.totalRevenue)}</p></Card>
        <Card><p className="text-sm text-muted">Outstanding</p><p className="text-2xl font-semibold">{ksh(m.outstanding)}</p></Card>
        <Card><p className="text-sm text-muted">Inventory value</p><p className="text-2xl font-semibold">{ksh(m.inventoryValue)}</p></Card>
      </div>
      <Card className="mt-4">
        <h3 className="font-semibold">Payment methods</h3>
        {methods.map((x) => (
          <p key={x.method} className="mt-2 text-sm">{`${x.method}: ${ksh(x._sum.amountCents || 0)}`}</p>
        ))}
      </Card>
    </div>
  );
}
