import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";
import { expiryTone } from "@/lib/status";

export default async function Expiry() {
  await requirePermission("inventory.view");
  const now = new Date();
  const batches = await prisma.inventoryBatch.findMany({
    where: { expiryDate: { not: null }, quantity: { gt: 0 } },
    include: { product: true, clinic: true },
  });
  return (
    <div>
      <PageHeader title="Expiry" />
      {batches.map((batch) => {
        const days = batch.expiryDate ? Math.ceil((batch.expiryDate.getTime() - now.getTime()) / 86400000) : 0;
        const label = days < 0 ? "expired" : `${days} days`;
        return (
          <Card key={batch.id} className="mb-2 flex justify-between">
            <span>{`${batch.product.name} - ${batch.batchNumber}`}</span>
            <Badge tone={expiryTone(days)}>{label}</Badge>
          </Card>
        );
      })}
    </div>
  );
}
