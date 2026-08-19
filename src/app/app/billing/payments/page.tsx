import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Card, PageHeader } from "@/components/ui";
import { ksh } from "@/lib/money";
import { format } from "date-fns";

export default async function PaymentsPage() {
  const user = await requirePermission("billing.view");
  const clinicId = await getSelectedClinicId(user);
  const rows = await prisma.payment.findMany({ where: clinicWhere(clinicId), include: { patient: true }, orderBy: { createdAt: "desc" }, take: 80 });
  return (
    <div>
      <PageHeader title="Payments" />
      {rows.map((p) => (
        <Card key={p.id} className="mb-2 flex justify-between text-sm">
          <span>{p.patient?.fullName || "Walk-in"} · {p.method} · {p.status}</span>
          <span>{ksh(p.amountCents)} · {format(p.createdAt, "dd MMM")}</span>
        </Card>
      ))}
    </div>
  );
}
