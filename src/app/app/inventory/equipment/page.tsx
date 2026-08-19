import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";

export default async function EquipmentPage() {
  await requirePermission("inventory.view");
  const rows = await prisma.equipment.findMany({ include: { clinic: true } });
  return (
    <div>
      <SectionBanner
        image="medicalEquipment"
        title="Clinic equipment assets"
        subtitle="Track serials, maintenance and condition separately from consumable stock."
        height="sm"
      />
      <PageHeader title="Clinic equipment" />
      {rows.map((e) => (
        <Card key={e.id} className="mb-2">{`${e.name} - ${e.assetNumber} - ${e.status} - ${e.clinic.name}`}</Card>
      ))}
    </div>
  );
}
