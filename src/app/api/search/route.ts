import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json({ patients: [], appointments: [], invoices: [], products: [], staff: [], clinics: [] });
  const [patients, invoices, products, staff, clinics] = await Promise.all([
    prisma.patient.findMany({ where: { OR: [{ fullName: { contains: q } }, { phone: { contains: q } }, { patientNumber: { contains: q } }] }, take: 8 }),
    prisma.invoice.findMany({ where: { invoiceNumber: { contains: q } }, take: 5 }),
    prisma.product.findMany({ where: { name: { contains: q } }, take: 8 }),
    prisma.user.findMany({ where: { name: { contains: q } }, take: 5 }),
    prisma.clinic.findMany({ where: { name: { contains: q } }, take: 5 }),
  ]);
  return NextResponse.json({ patients, invoices, products, staff, clinics });
}
