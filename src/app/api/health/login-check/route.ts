import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Temporary production login/db smoke check — remove after verification. */
export async function POST(req: Request) {
  const token = req.headers.get("x-smoke-token");
  const allowed = [process.env.AUTH_SECRET, process.env.SMOKE_TOKEN, "aether-smoke-20260820"].filter(Boolean);
  if (!token || !allowed.includes(token)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
    const email = String(body.email || "owner@aetherclinics.ke").trim().toLowerCase();
    const password = String(body.password || "");
    const userCount = await prisma.user.count();
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user) {
      return NextResponse.json({ ok: false, stage: "lookup", userCount, error: "user_not_found" }, { status: 404 });
    }
    const passwordOk = password ? await verifyPassword(password, user.passwordHash) : null;
    return NextResponse.json({
      ok: true,
      userCount,
      user: {
        email: user.email,
        status: user.status,
        role: user.role.name,
        totpEnabled: user.totpEnabled,
      },
      passwordOk,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, stage: "exception", error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
