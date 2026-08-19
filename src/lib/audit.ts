import { prisma } from "./db";

export async function audit(opts: {
  userId?: string | null;
  clinicId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  meta?: unknown;
  ip?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: opts.userId || undefined,
      clinicId: opts.clinicId || undefined,
      action: opts.action,
      entity: opts.entity,
      entityId: opts.entityId,
      meta: opts.meta ? JSON.stringify(opts.meta) : undefined,
      ip: opts.ip,
    },
  });
}

export async function notify(opts: {
  clinicId?: string | null;
  userId?: string | null;
  type: string;
  title: string;
  body: string;
  relatedUrl?: string;
}) {
  await prisma.notification.create({
    data: {
      clinicId: opts.clinicId || undefined,
      userId: opts.userId || undefined,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      relatedUrl: opts.relatedUrl,
    },
  });
}
