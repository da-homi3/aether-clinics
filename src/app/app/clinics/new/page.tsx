import { requirePermission } from "@/lib/auth";
import { createClinicAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";

export default async function NewClinic() {
  await requirePermission("settings.manage");
  return (
    <div>
      <PageHeader title="Add clinic" />
      <Card className="max-w-xl">
        <form action={createClinicAction} className="grid gap-3">
          <Field label="Name"><Input name="name" required /></Field>
          <Field label="Address"><Input name="address" /></Field>
          <Field label="Phone"><Input name="phone" /></Field>
          <Field label="Email"><Input name="email" type="email" /></Field>
          <Button type="submit">Create</Button>
        </form>
      </Card>
    </div>
  );
}
