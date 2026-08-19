import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { ksh } from "@/lib/money";
import Link from "next/link";

export default async function SalesHistory() {
  await requirePermission("inventory.sell");
  const sales = await prisma.sale.findMany({ include: { patient: true, clinic: true }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="Sales history" />
      {sales.map((s) => (
        <Card key={s.id} className="mb-2 flex justify-between">
          <Link href={`/app/pos/receipts/${s.id}`}>{s.receiptNumber} · {s.patient?.fullName || "Walk-in"}</Link>
          <span>{ksh(s.totalCents)}</span>
        </Card>
      ))}
    </div>
  );
}
