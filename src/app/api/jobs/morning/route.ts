import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { runMorningJobs } from "@/lib/notifications";

export async function POST() {
  const user = await getSessionUser();
  if (!user?.isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await runMorningJobs();
  return NextResponse.json({ ok: true });
}
