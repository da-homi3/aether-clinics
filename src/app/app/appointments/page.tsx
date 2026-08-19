import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { images } from "@/lib/images";
import { updateAppointmentStatusAction } from "@/lib/actions";
import { format } from "date-fns";
import { appointmentStatusTone } from "@/lib/status";
import Link from "next/link";

export default async function AppointmentsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ status?: string; view?: string }>;
}>) {
  const user = await requirePermission("appointments.view");
  const clinicId = await getSelectedClinicId(user);
  const { status } = await searchParams;
  const appts = await prisma.appointment.findMany({
    where: { archived: false, ...clinicWhere(clinicId), ...(status ? { status } : {}) },
    include: { patient: true, doctor: true, service: true, clinic: true },
    orderBy: { startAt: "asc" },
    take: 200,
  });
  return (
    <div>
      <SectionBanner
        image="receptionist"
        title="Appointment schedule"
        subtitle="Prevent double-booking and keep every status change in the audit trail."
        height="sm"
      />
      <PageHeader
        title="Appointments"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/app/appointments/calendar">
              <Button variant="secondary">Calendar</Button>
            </Link>
            <Link href="/app/appointments/new">
              <Button>Book</Button>
            </Link>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {["", "pending", "confirmed", "checked_in", "completed", "cancelled"].map((s) => (
          <Link key={s || "all"} href={s ? `/app/appointments?status=${s}` : "/app/appointments"} className="rounded-full border px-3 py-1">
            {s || "all"}
          </Link>
        ))}
        <Link href="/app/appointments/calendar" className="rounded-full border px-3 py-1">
          Calendar
        </Link>
      </div>
      {appts.length === 0 ? (
        <EmptyState
          title="No appointments scheduled"
          body="Book a consultation or treatment session."
          imageSrc={images.emptyAppointments}
          imageAlt="Quiet clinic waiting area"
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="p-3">When</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Service</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appts.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{format(a.startAt, "dd MMM HH:mm")}</td>
                  <td>{a.patient.fullName}</td>
                  <td>{a.doctor?.name || "—"}</td>
                  <td>{a.service?.name}</td>
                  <td>
                    <Badge tone={appointmentStatusTone(a.status)}>{a.status}</Badge>
                  </td>
                  <td className="p-3">
                    <form action={updateAppointmentStatusAction.bind(null, a.id, "checked_in")}>
                      <button type="submit" className="text-accent">Check in</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
