"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfDay,
} from "date-fns";
import { dragRescheduleAppointmentAction } from "@/lib/actions";
import { Button } from "@/components/ui";

export type CalendarAppointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  durationMin: number;
  patientName: string;
  doctorName: string | null;
};

const colors: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#0ea5e9",
  checked_in: "#8b5cf6",
  in_consultation: "#0f766e",
  completed: "#027a48",
  cancelled: "#b42318",
  no_show: "#6b7280",
  rescheduled: "#6366f1",
};

type View = "month" | "week" | "day";

export function AppointmentCalendar({ appointments }: Readonly<{ appointments: CalendarAppointment[] }>) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const days = useMemo(() => {
    if (view === "day") return [cursor];
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end: endOfWeek(cursor, { weekStartsOn: 1 }) });
    }
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor, view]);

  function onDrop(day: Date, hour?: number) {
    return async (e: React.DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/appointment-id");
      if (!id) return;
      const appt = appointments.find((a) => a.id === id);
      if (!appt) return;
      const next = new Date(day);
      if (typeof hour === "number") {
        next.setHours(hour, 0, 0, 0);
      } else {
        const prev = new Date(appt.startAt);
        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
      }
      startTransition(async () => {
        const res = await dragRescheduleAppointmentAction(id, next.toISOString());
        if (res?.error) {
          setError(res.error);
          return;
        }
        setError(null);
        router.refresh();
      });
    };
  }

  function allowDrop(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["month", "week", "day"] as View[]).map((v) => (
          <Button key={v} type="button" variant={view === v ? "primary" : "secondary"} onClick={() => setView(v)}>
            {v}
          </Button>
        ))}
        <Button type="button" variant="ghost" onClick={() => setCursor(startOfDay(new Date()))}>
          Today
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setCursor((c) => (view === "month" ? addMonths(c, -1) : addDays(c, view === "week" ? -7 : -1)))}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setCursor((c) => (view === "month" ? addMonths(c, 1) : addDays(c, view === "week" ? 7 : 1)))}
        >
          Next
        </Button>
        <p className="ml-auto text-sm font-medium">{format(cursor, view === "day" ? "EEEE, d MMM yyyy" : "MMMM yyyy")}</p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {pending ? <p className="text-xs text-muted">Saving reschedule…</p> : null}
      <p className="text-xs text-muted">Drag an appointment onto another day (or hour slot in day/week view) to reschedule.</p>

      {view === "month" ? (
        <div className="grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-1 text-xs font-semibold text-muted">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const items = appointments.filter((a) => isSameDay(new Date(a.startAt), day));
            return (
              <div
                key={day.toISOString()}
                onDragOver={allowDrop}
                onDrop={onDrop(day)}
                className={`min-h-28 rounded-xl border bg-surface p-2 text-xs ${isSameMonth(day, cursor) ? "" : "opacity-45"}`}
              >
                <div className="font-semibold">{format(day, "d")}</div>
                {items.map((a) => (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/appointment-id", a.id)}
                    className="mt-1 cursor-grab truncate rounded px-1 text-white active:cursor-grabbing"
                    style={{ background: colors[a.status] || "#0f766e" }}
                    title={`${a.patientName} · ${a.status}`}
                  >
                    {format(new Date(a.startAt), "HH:mm")} {a.patientName.split(" ")[0]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`grid gap-2 ${view === "week" ? "md:grid-cols-7" : "grid-cols-1"}`}>
          {days.map((day) => (
            <div key={day.toISOString()} className="rounded-xl border bg-surface p-2">
              <p className="mb-2 text-sm font-semibold">{format(day, "EEE d MMM")}</p>
              <div className="space-y-1">
                {Array.from({ length: 11 }, (_, i) => i + 7).map((hour) => {
                  const items = appointments.filter((a) => {
                    const t = new Date(a.startAt);
                    return isSameDay(t, day) && t.getHours() === hour;
                  });
                  return (
                    <div
                      key={hour}
                      onDragOver={allowDrop}
                      onDrop={onDrop(day, hour)}
                      className="min-h-12 rounded-lg border border-dashed border-border/70 px-2 py-1"
                    >
                      <span className="text-[10px] text-muted">{`${hour}:00`}</span>
                      {items.map((a) => (
                        <div
                          key={a.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/appointment-id", a.id)}
                          className="mt-1 cursor-grab rounded px-1 py-0.5 text-xs text-white"
                          style={{ background: colors[a.status] || "#0f766e" }}
                        >
                          {a.patientName} {a.doctorName ? `· ${a.doctorName}` : ""}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(colors).map(([status, color]) => (
          <span key={status} className="inline-flex items-center gap-1 rounded-full border px-2 py-1 capitalize">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {status.replaceAll("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
