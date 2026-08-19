import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Card, PageHeader } from "@/components/ui";

export default async function Records() {
  const user = await requirePermission("consultations.view");
  const clinicId = await getSelectedClinicId(user);
  const patients = await prisma.patient.findMany({
    where: clinicWhere(clinicId),
    include: { consultations: { take: 1, orderBy: { createdAt: "desc" } } },
    take: 40,
  });
  return (
    <div>
      <PageHeader title="Medical records" />
      {patients.map((p) => (
        <Card key={p.id} className="mb-2">
          {p.fullName} · last diagnosis: {p.consultations[0]?.diagnosis || "—"}
        </Card>
      ))}
    </div>
  );
}
