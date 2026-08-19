import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { AppointmentCalendar } from "@/components/appointment-calendar";
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export default async function CalendarPage() {
  const user = await requirePermission("appointments.view");
  const clinicId = await getSelectedClinicId(user);
  const now = new Date();
  const rangeStart = startOfWeek(startOfMonth(addMonths(now, -1)), { weekStartsOn: 1 });
  const rangeEnd = endOfWeek(endOfMonth(addMonths(now, 1)), { weekStartsOn: 1 });
  const appts = await prisma.appointment.findMany({
    where: {
      ...clinicWhere(clinicId),
      archived: false,
      startAt: { gte: rangeStart, lte: rangeEnd },
    },
    include: { patient: true, doctor: true },
    orderBy: { startAt: "asc" },
  });

  return (
    <div>
      <SectionBanner
        image="receptionist"
        title="Clinic calendar"
        subtitle="Day, week and month views with drag-and-drop rescheduling and clash prevention."
        height="sm"
      />
      <PageHeader title="Calendar" subtitle="Drag appointments to reschedule. Status colors stay consistent across views." />
      <AppointmentCalendar
        appointments={appts.map((a) => ({
          id: a.id,
          startAt: a.startAt.toISOString(),
          endAt: a.endAt.toISOString(),
          status: a.status,
          durationMin: a.durationMin,
          patientName: a.patient.fullName,
          doctorName: a.doctor?.name ?? null,
        }))}
      />
    </div>
  );
}
