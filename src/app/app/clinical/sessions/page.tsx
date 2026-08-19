import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId } from "@/lib/scope";
import { Button, Card, PageHeader } from "@/components/ui";
import { completeSessionAction } from "@/lib/actions";

export default async function SessionsPage() {
  const user = await requireUser();
  const clinicId = await getSelectedClinicId(user);
  const sessions = await prisma.treatmentSession.findMany({
    where: clinicId ? { plan: { clinicId } } : {},
    include: { plan: { include: { patient: true } } },
    orderBy: { sessionNumber: "asc" },
    take: 100,
  });
  return (
    <div>
      <PageHeader title="Sessions" />
      {sessions.map((s) => (
        <Card key={s.id} className="mb-2 flex items-center justify-between">
          <span>
            {s.plan.patient.fullName} · Session {s.sessionNumber} · {s.status}
          </span>
          {s.status !== "completed" ? (
            <form action={completeSessionAction.bind(null, s.id)}>
              <Button type="submit">Complete</Button>
            </form>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
