import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createStaffAction, toggleUserStatusAction, updateStaffRoleAction } from "@/lib/actions";
import { Badge, Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";

export default async function StaffPage() {
  await requirePermission("staff.manage");
  const users = await prisma.user.findMany({ include: { role: true, clinic: true }, orderBy: { name: "asc" } });
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
  const clinics = await prisma.clinic.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <SectionBanner
        image="doctorTeam"
        title="Staff & access"
        subtitle="Activate accounts, assign clinics and keep roles aligned to real workflows."
        height="sm"
      />
      <PageHeader title="Staff" />
      <Card className="mb-6 max-w-xl">
        <h3 className="mb-3 font-semibold">Add staff</h3>
        <form action={createStaffAction} className="grid gap-3">
          <Field label="Name"><Input name="name" required /></Field>
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Phone"><Input name="phone" /></Field>
          <Field label="Password"><Input name="password" type="password" defaultValue="Welcome123!" /></Field>
          <Field label="Role">
            <Select name="roleId">
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.isSystem ? "" : " (custom)"}</option>
              ))}
            </Select>
          </Field>
          <Field label="Clinic">
            <Select name="clinicId">
              <option value="">All / unassigned</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Button type="submit">Add staff</Button>
        </form>
      </Card>
      {users.map((u) => (
        <Card key={u.id} className="mb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{`${u.name} · ${u.staffId}`}</p>
              <p className="text-sm text-muted">{`${u.email} · ${u.role.name} · ${u.clinic?.name || "Group"}`}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={u.status === "active" ? "ok" : "danger"}>{u.status}</Badge>
              <form action={toggleUserStatusAction.bind(null, u.id)}>
                <Button variant="secondary" type="submit">{u.status === "active" ? "Deactivate" : "Activate"}</Button>
              </form>
            </div>
          </div>
          <form action={updateStaffRoleAction} className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
            <input type="hidden" name="userId" value={u.id} />
            <Field label="Assign role">
              <Select name="roleId" defaultValue={u.roleId}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}{r.isSystem ? "" : " (custom)"}</option>
                ))}
              </Select>
            </Field>
            <Field label="Clinic">
              <Select name="clinicId" defaultValue={u.clinicId || ""}>
                <option value="">All / unassigned</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Button variant="secondary" type="submit">Save assignment</Button>
          </form>
        </Card>
      ))}
    </div>
  );
}
