import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, Textarea, Button } from "@/components/ui";
import { addPatientNoteAction } from "@/lib/actions";
import { format } from "date-fns";
import { ksh } from "@/lib/money";

export default async function PatientProfile({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const user = await requirePermission("patients.view");
  const { id } = await params;
  const p = await prisma.patient.findUnique({
    where: { id },
    include: {
      clinic: true,
      appointments: { orderBy: { startAt: "desc" }, take: 20, include: { service: true, doctor: true } },
      consultations: { orderBy: { createdAt: "desc" }, take: 10, include: { doctor: true } },
      prescriptions: { include: { items: true }, orderBy: { createdAt: "desc" } },
      treatmentPlans: { include: { sessions: true, service: true } },
      invoices: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      sales: { include: { items: { include: { product: true } } } },
      documents: true,
      notesList: { orderBy: { createdAt: "desc" } },
      vitals: { orderBy: { recordedAt: "desc" }, take: 8 },
    },
  });
  if (!p) notFound();
  if (!user.isOwner && user.clinicId && p.clinicId !== user.clinicId) notFound();
  const age = p.dateOfBirth ? Math.floor((Date.now() - p.dateOfBirth.getTime()) / 31557600000) : null;
  const canClinical = user.isOwner || user.permissions.includes("consultations.view");
  return (
    <div>
      <PageHeader title={p.fullName} subtitle={`${p.patientNumber} · ${p.phone} · ${age ?? "—"} yrs · ${p.gender || "—"} · ${p.clinic.name}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold">Timeline</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {p.appointments.map((a) => (
              <li key={a.id} className="border-l-2 border-accent pl-3">
                {format(a.startAt, "dd MMM yyyy HH:mm")} · Appointment · {a.status}
              </li>
            ))}
            {p.payments.map((pay) => (
              <li key={pay.id} className="border-l-2 border-ok pl-3">
                {format(pay.createdAt, "dd MMM yyyy")} · Payment {ksh(pay.amountCents)} · {pay.method}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-semibold">Overview</h3>
          <p className="mt-2 text-sm text-muted">{p.address}</p>
          {canClinical ? (
            <>
              <p className="mt-3 text-sm">Allergies: {p.allergies || "None recorded"}</p>
              <p className="text-sm">History: {p.medicalHistory || "—"}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">Clinical notes are restricted for this role.</p>
          )}
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Appointments</h3>
          {p.appointments.map((a) => (
            <div key={a.id} className="mt-2 flex justify-between text-sm">
              <span>{format(a.startAt, "dd MMM")}</span>
              <Badge>{a.status}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="font-semibold">Invoices</h3>
          {p.invoices.map((i) => (
            <div key={i.id} className="mt-2 flex justify-between text-sm">
              <a className="text-accent" href={`/app/billing/invoices/${i.id}`}>
                {i.invoiceNumber}
              </a>
              <span>
                {ksh(i.totalCents - i.paidCents)} due
              </span>
            </div>
          ))}
        </Card>
        <Card>
          <h3 className="font-semibold">Treatment plans</h3>
          {p.treatmentPlans.map((t) => {
            const done = t.sessions.filter((s) => s.status === "completed").length;
            return (
              <div key={t.id} className="mt-2 text-sm">
                {t.name}: {done} / {t.totalSessions} sessions completed · {t.totalSessions - done} remaining
              </div>
            );
          })}
        </Card>
        <Card>
          <h3 className="font-semibold">Notes</h3>
          <form action={addPatientNoteAction} className="mt-2 space-y-2">
            <input type="hidden" name="patientId" value={p.id} />
            <Textarea name="body" required />
            <Button type="submit">Add note</Button>
          </form>
          {p.notesList.map((n) => (
            <p key={n.id} className="mt-2 text-sm">
              {n.body}
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}
