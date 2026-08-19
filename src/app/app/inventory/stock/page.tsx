import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { adjustStockAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";

export default async function StockPage() {
  await requirePermission("inventory.edit");
  const products = await prisma.product.findMany({ take: 200 });
  const moves = await prisma.inventoryMovement.findMany({ include: { product: true }, orderBy: { createdAt: "desc" }, take: 40 });
  return (
    <div>
      <PageHeader title="Stock movements" />
      <Card className="mb-6 max-w-xl">
        <form action={adjustStockAction} className="grid gap-3">
          <Select name="productId">{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
          <Field label="Quantity change"><Input name="quantity" type="number" required /></Field>
          <Field label="Type">
            <Select name="type">
              {["adjustment","purchase","return","damaged","expired","dispensed"].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Reason"><Input name="reason" /></Field>
          <Button type="submit">Record movement</Button>
        </form>
      </Card>
      {moves.map((m) => (
        <Card key={m.id} className="mb-2 text-sm">{m.product.name} · {m.type} · {m.previousQty} → {m.newQty}</Card>
      ))}
    </div>
  );
}
