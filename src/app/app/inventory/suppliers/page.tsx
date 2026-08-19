import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";

export default async function Suppliers() {
  await requirePermission("inventory.view");
  const rows = await prisma.supplier.findMany({ include: { clinic: true } });
  return (
    <div>
      <PageHeader title="Suppliers" />
      {rows.map((s) => (
        <Card key={s.id} className="mb-2">{s.name} · {s.contactPerson} · {s.clinic.name}</Card>
      ))}
    </div>
  );
}
