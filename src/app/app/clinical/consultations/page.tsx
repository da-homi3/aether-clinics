import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Button, Card, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import Link from "next/link";
import { format } from "date-fns";

export default async function ConsultationsPage() {
  const user = await requirePermission("consultations.view");
  const clinicId = await getSelectedClinicId(user);
  const rows = await prisma.consultation.findMany({
    where: clinicWhere(clinicId),
    include: { patient: true, doctor: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <SectionBanner
        image="doctorPatient"
        title="Electronic consultations"
        subtitle="Chief complaint, vitals, diagnosis and follow-up — timestamped for audit."
        height="sm"
      />
      <PageHeader title="Consultations" actions={<Link href="/app/clinical/consultations/new"><Button>New consultation</Button></Link>} />
      {rows.map((c) => (
        <Card key={c.id} className="mb-2 flex justify-between">
          <Link href={`/app/clinical/consultations/${c.id}`}>{`${c.patient.fullName} - ${c.doctor.name}`}</Link>
          <span className="text-sm text-muted">{`${c.status} - ${format(c.updatedAt, "dd MMM")}`}</span>
        </Card>
      ))}
    </div>
  );
}
