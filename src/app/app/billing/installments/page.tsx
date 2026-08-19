import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { ksh } from "@/lib/money";
import { format } from "date-fns";

export default async function Installments() {
  await requirePermission("billing.view");
  const rows = await prisma.installment.findMany({ include: { plan: { include: { invoice: { include: { patient: true } } } } }, take: 80 });
  return (
    <div>
      <PageHeader title="Installments" />
      {rows.map((i) => (
        <Card key={i.id} className="mb-2 text-sm">
          {i.plan.invoice.patient.fullName} · #{i.number} · {ksh(i.amountCents)} · due {format(i.dueDate, "dd MMM")} · {i.status}
        </Card>
      ))}
    </div>
  );
}
