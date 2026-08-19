import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { createTreatmentPlanAction } from "@/lib/actions";

export default async function Treatments() {
  const user = await requirePermission("patients.view");
  const clinicId = await getSelectedClinicId(user);
  const plans = await prisma.treatmentPlan.findMany({
    where: clinicWhere(clinicId),
    include: { patient: true, sessions: true, service: true },
  });
  const patients = await prisma.patient.findMany({ take: 100 });
  const services = await prisma.service.findMany({ where: { sessions: { gt: 1 } } });
  return (
    <div>
      <SectionBanner
        image="physiotherapy"
        title="Multi-session treatment packages"
        subtitle="Generate sessions, track completion and keep billing attached to the plan."
        height="sm"
      />
      <PageHeader title="Treatment packages" />
      <Card className="mb-6 max-w-xl">
        <form action={createTreatmentPlanAction} className="grid gap-3">
          <input type="hidden" name="clinicId" value={user.clinicId || ""} />
          <Field label="Patient">
            <Select name="patientId">
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Package">
            <Select name="serviceId">
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sessions">
            <Input name="sessions" type="number" defaultValue={10} />
          </Field>
          <Button type="submit">Create package + invoice</Button>
        </form>
      </Card>
      {plans.map((plan) => {
        const done = plan.sessions.filter((session) => session.status === "completed").length;
        const remaining = plan.totalSessions - done;
        return (
          <Card key={plan.id} className="mb-2">
            {`${plan.patient.fullName} - ${plan.name} - ${done} / ${plan.totalSessions} completed - ${remaining} remaining`}
          </Card>
        );
      })}
    </div>
  );
}
