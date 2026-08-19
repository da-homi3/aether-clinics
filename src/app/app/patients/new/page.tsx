import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPatientAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";

export default async function NewPatientPage() {
  const user = await requirePermission("patients.create");
  const clinics = await prisma.clinic.findMany();
  return (
    <div>
      <PageHeader title="Register patient" />
      <Card className="max-w-2xl">
        <form action={createPatientAction} className="grid gap-4">
          <Field label="Clinic">
            <Select name="clinicId" defaultValue={user.clinicId || clinics[0]?.id} required>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Full name">
            <Input name="fullName" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <Input name="phone" required />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of birth">
              <Input name="dateOfBirth" type="date" />
            </Field>
            <Field label="Gender">
              <Select name="gender">
                <option value="">Select</option>
                <option>female</option>
                <option>male</option>
                <option>other</option>
              </Select>
            </Field>
          </div>
          <Field label="Address">
            <Input name="address" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Emergency contact">
              <Input name="emergencyName" />
            </Field>
            <Field label="Emergency phone">
              <Input name="emergencyPhone" />
            </Field>
          </div>
          <Field label="Insurance">
            <Input name="insuranceInfo" />
          </Field>
          <Field label="Allergies">
            <Textarea name="allergies" />
          </Field>
          <Field label="Medical history">
            <Textarea name="medicalHistory" />
          </Field>
          <Button type="submit">Save patient</Button>
        </form>
      </Card>
    </div>
  );
}
