import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSelectedClinicId, clinicWhere } from "@/lib/scope";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { images } from "@/lib/images";
import Link from "next/link";

export default async function PatientsPage({ searchParams }: Readonly<{ searchParams: Promise<{ q?: string }> }>) {
  const user = await requirePermission("patients.view");
  const clinicId = await getSelectedClinicId(user);
  const { q } = await searchParams;
  const patients = await prisma.patient.findMany({
    where: {
      archived: false,
      ...clinicWhere(clinicId),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
              { patientNumber: { contains: q } },
            ],
          }
        : {}),
    },
    include: { clinic: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <SectionBanner
        image="nurseCare"
        title="Patient registry"
        subtitle="Search by ID, name, phone or email across your clinic network."
        height="sm"
      />
      <PageHeader
        title="Patients"
        subtitle="Search by ID, name, phone or email"
        actions={
          <Link href="/app/patients/new">
            <Button>Add patient</Button>
          </Link>
        }
      />
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search patients" className="w-full max-w-md rounded-xl border px-3 py-2" />
      </form>
      {patients.length === 0 ? (
        <EmptyState
          title="No patients found"
          body="Register a patient to begin appointments and billing."
          imageSrc={images.emptyPatients}
          imageAlt="Calm clinical care setting"
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="p-3">ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Clinic</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium">{p.patientNumber}</td>
                  <td>{p.fullName}</td>
                  <td>{p.phone}</td>
                  <td>
                    <Badge>{p.clinic.name}</Badge>
                  </td>
                  <td className="p-3">
                    <Link href={`/app/patients/${p.id}`} className="text-accent">
                      Open
                    </Link>
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
