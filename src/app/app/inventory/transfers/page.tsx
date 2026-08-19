import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { approveTransferAction, createTransferAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";

export default async function Transfers() {
  await requirePermission("inventory.edit");
  const clinics = await prisma.clinic.findMany();
  const products = await prisma.product.findMany({ take: 80 });
  const rows = await prisma.stockTransfer.findMany({ include: { fromClinic: true, toClinic: true, items: true }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="Stock transfers" />
      <Card className="mb-6 max-w-xl">
        <form action={createTransferAction} className="grid gap-3">
          <Field label="From"><Select name="fromClinicId">{clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="To"><Select name="toClinicId">{clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Select name="productId">{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          <Input name="quantity" type="number" defaultValue={10} />
          <Button type="submit">Request transfer</Button>
        </form>
      </Card>
      {rows.map((t) => (
        <Card key={t.id} className="mb-2 flex justify-between">
          <span>{t.fromClinic.name} → {t.toClinic.name} · {t.status}</span>
          {t.status === "requested" ? (
            <form action={approveTransferAction.bind(null, t.id)}><Button type="submit">Approve & receive</Button></form>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
