import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { format } from "date-fns";

export default async function AuditPage() {
  await requirePermission("settings.manage");
  const rows = await prisma.auditLog.findMany({ include: { user: true, clinic: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <PageHeader title="Audit log" />
      {rows.map((r) => (
        <Card key={r.id} className="mb-2 text-sm">
          {format(r.createdAt, "dd MMM HH:mm")} · {r.user?.name || "system"} · {r.action} · {r.entity} · {r.clinic?.name || "—"}
        </Card>
      ))}
    </div>
  );
}
