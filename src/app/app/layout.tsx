import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId } from "@/lib/scope";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const clinics = await prisma.clinic.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const selected = (await getSelectedClinicId(user)) || "all";
  const unread = await prisma.notification.count({
    where: { read: false, OR: [{ userId: user.id }, { userId: null }] },
  });
  return (
    <AppShell
      user={user}
      clinics={clinics}
      selectedClinic={user.isOwner ? selected : user.clinicId || selected}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}
