import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";

export default async function LowStock() {
  await requirePermission("inventory.view");
  const products = await prisma.product.findMany({ include: { batches: true, clinic: true } });
  const low = products.filter((p) => p.batches.reduce((s, b) => s + b.quantity, 0) <= p.minQty);
  return (
    <div>
      <PageHeader title="Low stock" />
      {low.map((p) => (
        <Card key={p.id} className="mb-2 flex justify-between">
          <span>{p.name} · {p.clinic.name}</span>
          <Badge tone="danger">{p.batches.reduce((s, b) => s + b.quantity, 0)} / min {p.minQty}</Badge>
        </Card>
      ))}
    </div>
  );
}
