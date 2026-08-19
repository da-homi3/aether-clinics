import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Button, Card, PageHeader } from "@/components/ui";
import { completeConsultationAction } from "@/lib/actions";

export default async function ConsultationDetail({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission("consultations.view");
  const { id } = await params;
  const c = await prisma.consultation.findUnique({
    where: { id },
    include: { patient: true, doctor: true, vitals: true, prescriptions: { include: { items: true } } },
  });
  if (!c) notFound();
  return (
    <div>
      <PageHeader title={`Consultation · ${c.patient.fullName}`} subtitle={c.doctor.name} />
      <Card className="space-y-2 whitespace-pre-wrap text-sm">
        <p><b>Complaint:</b> {c.chiefComplaint}</p>
        <p><b>Diagnosis:</b> {c.diagnosis}</p>
        <p><b>Notes:</b> {c.clinicalNotes}</p>
        {c.vitals[0] ? <p><b>Vitals:</b> {c.vitals[0].pulse} bpm · BMI {c.vitals[0].bmi}</p> : null}
      </Card>
      {c.status !== "completed" ? (
        <form className="mt-4" action={completeConsultationAction.bind(null, c.id)}>
          <Button type="submit">Mark complete</Button>
        </form>
      ) : null}
    </div>
  );
}
