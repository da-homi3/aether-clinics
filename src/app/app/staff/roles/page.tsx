import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { RolesManager } from "@/components/roles-manager";

export default async function RolesPage() {
  await requirePermission("staff.manage");
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <SectionBanner
        image="doctorTeam"
        title="Roles & permissions"
        subtitle="Edit seeded roles or create custom roles with granular permission keys."
        height="sm"
      />
      <PageHeader title="Roles & permissions" subtitle="Changes apply on the next request for affected staff." />
      <RolesManager
        roles={roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
          permissionKeys: r.permissions.map((p) => p.permission.key),
        }))}
      />
    </div>
  );
}
