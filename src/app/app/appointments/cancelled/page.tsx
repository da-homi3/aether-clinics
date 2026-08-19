import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Card, PageHeader } from "@/components/ui";

export default async function Cancelled() {
  const user = await requirePermission("appointments.view");
  const clinicId = await getSelectedClinicId(user);
  const appts = await prisma.appointment.findMany({
    where: { ...clinicWhere(clinicId), status: "cancelled" },
    include: { patient: true },
    take: 80,
  });
  return (
    <div>
      <PageHeader title="Cancelled" />
      {appts.map((a) => (
        <Card key={a.id} className="mb-2">{a.patient.fullName}</Card>
      ))}
    </div>
  );
}
