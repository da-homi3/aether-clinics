import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPrescriptionAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";

export default async function NewRx() {
  const user = await requirePermission("consultations.create");
  const patients = await prisma.patient.findMany({ take: 200 });
  const products = await prisma.product.findMany({ where: { type: "medicine" }, take: 100 });
  return (
    <div>
      <PageHeader title="Create prescription" />
      <Card className="max-w-xl">
        <form action={createPrescriptionAction} className="grid gap-3">
          <input type="hidden" name="clinicId" value={user.clinicId || ""} />
          <Field label="Patient">
            <Select name="patientId">{patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</Select>
          </Field>
          <Field label="Medicine">
            <Select name="productId">
              <option value="">Free text</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Medicine name"><Input name="medicineName" required /></Field>
          <Field label="Dosage"><Input name="dosage" required /></Field>
          <Field label="Frequency"><Input name="frequency" required /></Field>
          <Field label="Duration"><Input name="duration" required /></Field>
          <Field label="Quantity"><Input name="quantity" type="number" defaultValue={1} /></Field>
          <Field label="Instructions"><Input name="instructions" /></Field>
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </div>
  );
}
