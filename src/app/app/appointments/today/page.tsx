import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { images } from "@/lib/images";
import { updateAppointmentStatusAction } from "@/lib/actions";
import { format } from "date-fns";

export default async function TodayAppointments() {
  const user = await requirePermission("appointments.view");
  const clinicId = await getSelectedClinicId(user);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const appts = await prisma.appointment.findMany({
    where: { ...clinicWhere(clinicId), startAt: { gte: start, lt: end }, archived: false },
    include: { patient: true, doctor: true, service: true },
    orderBy: { startAt: "asc" },
  });
  return (
    <div>
      <SectionBanner
        image="stethoscope"
        title="Today at the clinic"
        subtitle="Check patients in and keep the waiting list moving."
        height="sm"
      />
      <PageHeader title="Today's appointments" />
      {appts.length === 0 ? (
        <EmptyState
          title="No appointments today"
          body="The schedule is clear."
          imageSrc={images.emptyAppointments}
          imageAlt="Empty clinic schedule"
        />
      ) : (
        <div className="grid gap-3">
          {appts.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{a.patient.fullName}</p>
                <p className="text-sm text-muted">
                  {`${format(a.startAt, "HH:mm")} - ${a.doctor?.name ?? "Unassigned"} - ${a.service?.name ?? ""}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{a.status}</Badge>
                <form action={updateAppointmentStatusAction.bind(null, a.id, "checked_in")}>
                  <button type="submit" className="rounded-xl bg-accent px-3 py-2 text-sm text-white">Check in</button>
                </form>
                <form action={updateAppointmentStatusAction.bind(null, a.id, "completed")}>
                  <button type="submit" className="rounded-xl border px-3 py-2 text-sm">Complete</button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
