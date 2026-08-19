import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.patient.findMany({ include: { clinic: true } });
  const csv = ["id,name,phone,clinic"]
    .concat(rows.map((p) => [p.patientNumber, p.fullName, p.phone, p.clinic.name].join(",")))
    .join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=patients.csv" } });
}
