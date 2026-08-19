import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Card, PageHeader } from "@/components/ui";
import { format } from "date-fns";

export default async function Completed() {
  const user = await requirePermission("appointments.view");
  const clinicId = await getSelectedClinicId(user);
  const appts = await prisma.appointment.findMany({
    where: { ...clinicWhere(clinicId), status: "completed" },
    include: { patient: true },
    orderBy: { startAt: "desc" },
    take: 80,
  });
  return (
    <div>
      <PageHeader title="Completed appointments" />
      {appts.map((a) => (
        <Card key={a.id} className="mb-2">{a.patient.fullName} · {format(a.startAt, "dd MMM yyyy")}</Card>
      ))}
    </div>
  );
}
