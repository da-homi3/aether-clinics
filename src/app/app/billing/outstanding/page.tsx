import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId } from "@/lib/scope";
import { Card, PageHeader } from "@/components/ui";
import { ksh } from "@/lib/money";

export default async function Outstanding() {
  const user = await requirePermission("billing.view");
  const clinicId = await getSelectedClinicId(user);
  const invoices = await prisma.invoice.findMany({
    where: { ...(clinicId ? { clinicId } : {}), status: { in: ["pending", "partially_paid", "overdue"] } },
    include: { patient: true },
  });
  return (
    <div>
      <PageHeader title="Outstanding" />
      {invoices.filter((i) => i.totalCents > i.paidCents).map((i) => (
        <Card key={i.id} className="mb-2 flex justify-between">
          <a href={`/app/billing/invoices/${i.id}`} className="text-accent">{i.patient.fullName} · {i.invoiceNumber}</a>
          <span>{ksh(i.totalCents - i.paidCents)}</span>
        </Card>
      ))}
    </div>
  );
}
