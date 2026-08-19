import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { ksh } from "@/lib/money";
import { format } from "date-fns";
import { PrintButton } from "@/components/print-button";
import { PdfDownloadButton } from "@/components/pdf-download-button";

export default async function Receipt({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission("inventory.sell");
  const { id } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { clinic: true, patient: true, items: { include: { product: true } } },
  });
  if (!sale) notFound();

  const patientLabel = sale.patient?.fullName ?? "Walk-in";
  const when = format(sale.createdAt, "dd MMM yyyy HH:mm");
  const lines = [
    ...sale.items.map((item) => ({
      label: `${item.product.name} x ${item.quantity}`,
      amount: ksh(item.totalCents),
    })),
    { label: `Total (${sale.method})`, amount: ksh(sale.totalCents) },
  ];

  return (
    <div>
      <PageHeader title={`Receipt ${sale.receiptNumber}`} />
      <Card className="max-w-md print:shadow-none">
        <p className="font-semibold">{sale.clinic.name}</p>
        <p className="text-sm text-muted">{sale.clinic.address}</p>
        <p className="mt-4 text-sm">{`Patient: ${patientLabel}`}</p>
        <p className="text-sm">{`${when} - ${sale.staffName ?? ""}`}</p>
        <ul className="mt-4 text-sm">
          {sale.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{`${item.product.name} x ${item.quantity}`}</span>
              <span>{ksh(item.totalCents)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-semibold">{`Total ${ksh(sale.totalCents)} - ${sale.method}`}</p>
        <p className="mt-6 text-sm">Thank you for choosing Aether Clinics.</p>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <PdfDownloadButton
            title={`Receipt ${sale.receiptNumber}`}
            subtitle={`${sale.clinic.name} · ${patientLabel} · ${when}`}
            lines={lines}
            footer="Thank you for choosing Aether Clinics."
            fileName={`${sale.receiptNumber}.pdf`}
          />
        </div>
      </Card>
    </div>
  );
}
