import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clinicPerformance } from "@/lib/metrics";
import { Button, Card, PageHeader } from "@/components/ui";
import { ClinicPhoto, SectionBanner } from "@/components/section-visual";
import { clinicGallery } from "@/lib/images";
import { ksh } from "@/lib/money";
import Link from "next/link";

export default async function ClinicsPage() {
  await requireUser();
  const clinics = await prisma.clinic.findMany();
  return (
    <div>
      <SectionBanner
        image="modernHospital"
        title="Clinic network"
        subtitle="Each branch keeps its own patients, inventory and revenue — with group-wide oversight for owners."
      />
      <PageHeader title="Clinics" actions={<Link href="/app/clinics/new"><Button>Add clinic</Button></Link>} />
      <div className="grid gap-4 md:grid-cols-3">
        {clinics.map((c, i) => (
          <ClinicPhoto
            key={c.id}
            src={clinicGallery[i % clinicGallery.length]}
            alt={`${c.name} facility`}
            name={c.name}
            address={c.address}
            phone={c.phone}
          />
        ))}
      </div>
    </div>
  );
}

export async function PerformanceTable() {
  const rows = await clinicPerformance();
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-3">Clinic</th>
            <th>Revenue</th>
            <th>Patients</th>
            <th>Appts</th>
            <th>Cancel %</th>
            <th>Outstanding</th>
            <th>Medicine sales</th>
            <th>Stock value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.clinic.id} className="border-t">
              <td className="p-3">{r.clinic.name}</td>
              <td>{ksh(r.totalRevenue)}</td>
              <td>{r.patients}</td>
              <td>{r.appointments}</td>
              <td>{r.cancellationRate}%</td>
              <td>{ksh(r.outstanding)}</td>
              <td>{ksh(r.medicineSales)}</td>
              <td>{ksh(r.inventoryValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
