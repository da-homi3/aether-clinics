import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addExpenseAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { ksh } from "@/lib/money";

export default async function Expenses() {
  const user = await requirePermission("billing.create");
  const clinics = await prisma.clinic.findMany();
  const rows = await prisma.expense.findMany({ include: { clinic: true }, orderBy: { incurredAt: "desc" } });
  return (
    <div>
      <PageHeader title="Expenses" />
      <Card className="mb-6 max-w-xl">
        <form action={addExpenseAction} className="grid gap-3">
          <Select name="clinicId" defaultValue={user.clinicId || clinics[0]?.id}>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </Select>
          <Field label="Category">
            <Input name="category" defaultValue="operations" />
          </Field>
          <Field label="Description">
            <Input name="description" required />
          </Field>
          <Field label="Amount KES">
            <Input name="amount" type="number" required />
          </Field>
          <Button type="submit">Add expense</Button>
        </form>
      </Card>
      {rows.map((expense) => (
        <Card key={expense.id} className="mb-2 flex justify-between text-sm">
          <span>{`${expense.clinic.name} - ${expense.description}`}</span>
          <span>{ksh(expense.amountCents)}</span>
        </Card>
      ))}
    </div>
  );
}
