import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Button, Card, PageHeader } from "@/components/ui";
import Link from "next/link";

export default async function RxPage() {
  const user = await requirePermission("consultations.view");
  const clinicId = await getSelectedClinicId(user);
  const rows = await prisma.prescription.findMany({
    where: clinicWhere(clinicId),
    include: { patient: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="Prescriptions" actions={<Link href="/app/clinical/prescriptions/new"><Button>New</Button></Link>} />
      {rows.map((r) => (
        <Card key={r.id} className="mb-2">
          {r.patient.fullName}: {r.items.map((i) => i.medicineName).join(", ")}
        </Card>
      ))}
    </div>
  );
}
