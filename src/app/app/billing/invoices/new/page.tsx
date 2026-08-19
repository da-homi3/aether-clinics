import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createInvoiceAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";

export default async function NewInvoice() {
  const user = await requirePermission("billing.create");
  const patients = await prisma.patient.findMany({ take: 200 });
  const services = await prisma.service.findMany({ where: { isActive: true } });
  const clinics = await prisma.clinic.findMany();
  return (
    <div>
      <PageHeader title="New invoice" />
      <Card className="max-w-xl">
        <form action={createInvoiceAction} className="grid gap-3">
          <Field label="Clinic">
            <Select name="clinicId" defaultValue={user.clinicId || clinics[0]?.id}>
              {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Patient">
            <Select name="patientId">{patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</Select>
          </Field>
          <Field label="Service">
            <Select name="serviceId">{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          </Field>
          <Field label="Amount (KES) if custom"><Input name="amount" type="number" /></Field>
          <Button type="submit">Create</Button>
        </form>
      </Card>
    </div>
  );
}
