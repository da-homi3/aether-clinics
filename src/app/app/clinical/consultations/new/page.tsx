import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createConsultationAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";

export default async function NewConsultation() {
  const user = await requirePermission("consultations.create");
  const patients = await prisma.patient.findMany({ take: 200 });
  const appts = await prisma.appointment.findMany({
    where: { status: { in: ["checked_in", "confirmed", "pending"] } },
    include: { patient: true },
    take: 50,
  });
  return (
    <div>
      <PageHeader title="Consultation record" />
      <Card className="max-w-2xl">
        <form action={createConsultationAction} className="grid gap-3">
          <input type="hidden" name="clinicId" value={user.clinicId || ""} />
          <Field label="Patient">
            <Select name="patientId" required>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Linked appointment">
            <Select name="appointmentId">
              <option value="">None</option>
              {appts.map((a) => (
                <option key={a.id} value={a.id}>{a.patient.fullName}</option>
              ))}
            </Select>
          </Field>
          <Field label="Chief complaint"><Textarea name="chiefComplaint" /></Field>
          <Field label="Symptoms"><Textarea name="symptoms" /></Field>
          <Field label="Examination"><Textarea name="examination" /></Field>
          <Field label="Diagnosis"><Textarea name="diagnosis" /></Field>
          <Field label="Treatment"><Textarea name="treatment" /></Field>
          <Field label="Clinical notes"><Textarea name="clinicalNotes" /></Field>
          <Field label="Follow-up"><Textarea name="followUp" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="BP systolic"><Input name="systolic" type="number" /></Field>
            <Field label="BP diastolic"><Input name="diastolic" type="number" /></Field>
            <Field label="Pulse"><Input name="pulse" type="number" /></Field>
            <Field label="Temp °C"><Input name="temperatureC" type="number" step="0.1" /></Field>
            <Field label="Weight kg"><Input name="weightKg" type="number" step="0.1" /></Field>
            <Field label="Height cm"><Input name="heightCm" type="number" /></Field>
            <Field label="SpO2"><Input name="spo2" type="number" /></Field>
            <Field label="Resp. rate"><Input name="respiratoryRate" type="number" /></Field>
          </div>
          <Button type="submit">Save consultation</Button>
        </form>
      </Card>
    </div>
  );
}
