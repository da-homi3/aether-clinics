import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPurchaseOrderAction, receivePurchaseAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";

export default async function Purchases() {
  const user = await requirePermission("inventory.create");
  const suppliers = await prisma.supplier.findMany();
  const products = await prisma.product.findMany({ take: 100 });
  const clinics = await prisma.clinic.findMany();
  const pos = await prisma.purchaseOrder.findMany({ include: { supplier: true, items: true }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="Purchase orders" />
      <Card className="mb-6 max-w-xl">
        <form action={createPurchaseOrderAction} className="grid gap-3">
          <Select name="clinicId" defaultValue={user.clinicId || clinics[0]?.id}>{clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          <Select name="supplierId">{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          <Select name="productId">{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          <Field label="Qty"><Input name="quantity" type="number" defaultValue={20} /></Field>
          <Field label="Unit price KES"><Input name="unitPrice" type="number" /></Field>
          <Button type="submit">Create PO</Button>
        </form>
      </Card>
      {pos.map((p) => (
        <Card key={p.id} className="mb-2 flex justify-between">
          <span>{p.supplier.name} · {p.status}</span>
          {p.status !== "received" ? (
            <form action={receivePurchaseAction.bind(null, p.id)}><Button type="submit">Receive stock</Button></form>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
