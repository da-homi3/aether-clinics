import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";

export default async function Schedules() {
  await requirePermission("staff.manage");
  const users = await prisma.user.findMany({ where: { status: "active" }, include: { clinic: true } });
  return (
    <div>
      <PageHeader title="Staff schedules" subtitle="Appointments respect doctor availability when a clash is detected." />
      {users.map((u) => (
        <Card key={u.id} className="mb-2">{u.name} · {u.department || "—"} · {u.clinic?.name || "Group"} · {u.workingHours || "08:00–17:00"}</Card>
      ))}
    </div>
  );
}
