import { NextResponse } from "next/server";
import { confirmMpesaWebhook } from "@/lib/actions";

export async function POST(req: Request) {
  const secret = req.headers.get("x-mpesa-secret");
  if (secret !== process.env.MPESA_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  await confirmMpesaWebhook(body.paymentId, body.providerRef);
  return NextResponse.json({ ok: true });
}
