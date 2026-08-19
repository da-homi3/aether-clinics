import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.permissions.includes("reports.view") && !user?.isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await prisma.payment.findMany({ include: { patient: true, clinic: true } });
  const csv = ["date,clinic,patient,method,amount_cents,status,reference"]
    .concat(
      rows.map((p) =>
        [p.createdAt.toISOString(), p.clinic.name, p.patient?.fullName || "", p.method, p.amountCents, p.status, p.reference || ""].join(","),
      ),
    )
    .join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=payments.csv" } });
}
