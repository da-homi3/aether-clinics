import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Badge, Card, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { ksh } from "@/lib/money";

export default async function InventoryPage({ searchParams }: Readonly<{ searchParams: Promise<{ type?: string }> }>) {
  const user = await requirePermission("inventory.view");
  const clinicId = await getSelectedClinicId(user);
  const { type } = await searchParams;
  const products = await prisma.product.findMany({
    where: { ...clinicWhere(clinicId), ...(type ? { type } : {}) },
    include: { batches: true, clinic: true },
  });
  return (
    <div>
      <SectionBanner
        image="pharmacy"
        title="Medicine & product inventory"
        subtitle="Stock levels, batch expiry and clinic-scoped quantities — never silent adjustments."
        height="sm"
      />
      <PageHeader title="Inventory" />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted"><th className="p-3">SKU</th><th>Name</th><th>Qty</th><th>Value</th><th>Clinic</th></tr></thead>
          <tbody>
            {products.map((p) => {
              const qty = p.batches.reduce((s, b) => s + b.quantity, 0);
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{qty} {qty <= p.minQty ? <Badge tone="danger">low</Badge> : null}</td>
                  <td>{ksh(qty * p.purchaseCents)}</td>
                  <td>{p.clinic.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
