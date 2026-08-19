import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Badge, Card, PageHeader } from "@/components/ui";
import { format } from "date-fns";

export default async function Upcoming() {
  const user = await requirePermission("appointments.view");
  const clinicId = await getSelectedClinicId(user);
  const appts = await prisma.appointment.findMany({
    where: { ...clinicWhere(clinicId), startAt: { gte: new Date() }, status: { notIn: ["cancelled"] } },
    include: { patient: true, doctor: true },
    orderBy: { startAt: "asc" },
    take: 80,
  });
  return (
    <div>
      <PageHeader title="Upcoming" />
      {appts.map((a) => (
        <Card key={a.id} className="mb-2 flex justify-between">
          <span>{a.patient.fullName} · {format(a.startAt, "dd MMM HH:mm")}</span>
          <Badge>{a.status}</Badge>
        </Card>
      ))}
    </div>
  );
}
