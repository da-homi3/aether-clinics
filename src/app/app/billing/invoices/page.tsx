import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { invoiceStatusTone } from "@/lib/status";
import { ksh } from "@/lib/money";
import Link from "next/link";

export default async function InvoicesPage() {
  const user = await requirePermission("billing.view");
  const clinicId = await getSelectedClinicId(user);
  const invoices = await prisma.invoice.findMany({
    where: clinicWhere(clinicId),
    include: { patient: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <SectionBanner
        image="billingDesk"
        title="Invoices & collections"
        subtitle="Installments, outstanding balances and payment methods in one ledger."
        height="sm"
      />
      <PageHeader title="Invoices" actions={<Link href="/app/billing/invoices/new"><Button>New invoice</Button></Link>} />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted"><th className="p-3">No.</th><th>Patient</th><th>Total</th><th>Balance</th><th>Status</th></tr></thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-3"><Link className="text-accent" href={`/app/billing/invoices/${i.id}`}>{i.invoiceNumber}</Link></td>
                <td>{i.patient.fullName}</td>
                <td>{ksh(i.totalCents)}</td>
                <td>{ksh(i.totalCents - i.paidCents)}</td>
                <td>
                  <Badge tone={invoiceStatusTone(i.status)}>{i.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
