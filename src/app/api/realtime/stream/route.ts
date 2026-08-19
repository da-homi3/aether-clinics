import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("connected", { ok: true, at: new Date().toISOString() });

      const tick = async () => {
        if (closed) return;
        const unread = await prisma.notification.count({
          where: { read: false, OR: [{ userId: user.id }, { userId: null }] },
        });
        const latest = await prisma.notification.findFirst({
          where: { OR: [{ userId: user.id }, { userId: null }] },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, createdAt: true },
        });
        const paymentsToday = await prisma.payment.count({
          where: {
            status: "completed",
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            ...(user.clinicId && !user.isOwner ? { clinicId: user.clinicId } : {}),
          },
        });
        send("snapshot", {
          unread,
          latestNotificationId: latest?.id ?? null,
          latestTitle: latest?.title ?? null,
          paymentsToday,
          at: new Date().toISOString(),
        });
      };

      await tick();
      const interval = setInterval(() => {
        void tick();
      }, 5000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
