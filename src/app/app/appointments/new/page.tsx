import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAppointmentAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";

export default async function NewAppointment() {
  const user = await requirePermission("appointments.create");
  const clinics = await prisma.clinic.findMany();
  const patients = await prisma.patient.findMany({ take: 200, orderBy: { fullName: "asc" } });
  const doctors = await prisma.user.findMany({ where: { role: { name: "Doctor" }, status: "active" } });
  const services = await prisma.service.findMany({ where: { isActive: true } });
  return (
    <div>
      <PageHeader title="Book appointment" />
      <Card className="max-w-xl">
        <form action={createAppointmentAction} className="grid gap-3">
          <Field label="Clinic">
            <Select name="clinicId" defaultValue={user.clinicId || clinics[0]?.id}>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Patient">
            <Select name="patientId" required>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName} ({p.patientNumber})</option>
              ))}
            </Select>
          </Field>
          <Field label="Doctor">
            <Select name="doctorId">
              <option value="">Unassigned</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Service">
            <Select name="serviceId">
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.clinicId.slice(0,4)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Start">
            <Input name="startAt" type="datetime-local" required />
          </Field>
          <Field label="Duration (min)">
            <Input name="durationMin" type="number" defaultValue={30} min={10} />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" />
          </Field>
          <Button type="submit">Save appointment</Button>
        </form>
      </Card>
    </div>
  );
}
