import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markNotificationsReadAction } from "@/lib/actions";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { images } from "@/lib/images";
import { format } from "date-fns";

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = await prisma.notification.findMany({
    where: { OR: [{ userId: user.id }, { userId: null }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <PageHeader title="Notifications" actions={<form action={markNotificationsReadAction}><Button type="submit">Mark all read</Button></form>} />
      {rows.length === 0 ? (
        <EmptyState
          title="No notifications"
          body="Operational alerts will appear here. Medical details are never included."
          imageSrc={images.emptyNotifications}
          imageAlt="Calm reception desk"
        />
      ) : (
        rows.map((n) => (
          <Card key={n.id} className="mb-2">
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-muted">{n.body}</p>
            <p className="mt-1 text-xs">{`${format(n.createdAt, "dd MMM HH:mm")}${n.read ? "" : " - unread"}`}</p>
          </Card>
        ))
      )}
    </div>
  );
}
