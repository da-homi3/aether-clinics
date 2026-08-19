import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Badge, Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { collectPaymentAction, splitInstallmentsAction } from "@/lib/actions";
import { ksh } from "@/lib/money";
import { PrintButton } from "@/components/print-button";
import { PdfDownloadButton } from "@/components/pdf-download-button";

export default async function InvoiceDetail({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission("billing.view");
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { patient: true, clinic: true, items: true, payments: true, paymentPlan: { include: { installments: true } } },
  });
  if (!inv) notFound();
  const balance = inv.totalCents - inv.paidCents;
  const pdfLines = [
    ...inv.items.map((i) => ({ label: i.description, amount: ksh(i.totalCents) })),
    { label: "Paid", amount: ksh(inv.paidCents) },
    { label: "Balance", amount: ksh(balance) },
  ];
  return (
    <div>
      <PageHeader title={inv.invoiceNumber} subtitle={`${inv.patient.fullName} - ${inv.clinic.name}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Badge>{inv.status}</Badge>
          <p className="mt-3">Total {ksh(inv.totalCents)}</p>
          <p>Paid {ksh(inv.paidCents)}</p>
          <p className="text-xl font-semibold">Balance {ksh(balance)}</p>
          <ul className="mt-4 text-sm">
            {inv.items.map((i) => (
              <li key={i.id}>{`${i.description} - ${ksh(i.totalCents)}`}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <PrintButton />
            <PdfDownloadButton
              title={inv.invoiceNumber}
              subtitle={`${inv.patient.fullName} - ${inv.clinic.name}`}
              lines={pdfLines}
              footer="Payment due as stated on this invoice."
              fileName={`${inv.invoiceNumber}.pdf`}
            />
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Collect payment</h3>
          <form action={collectPaymentAction} className="mt-3 grid gap-3">
            <input type="hidden" name="invoiceId" value={inv.id} />
            <Field label="Amount (KES)"><Input name="amount" type="number" defaultValue={Math.round(balance / 100)} min={1} required /></Field>
            <Field label="Method">
              <Select name="method">
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Phone (M-Pesa)"><Input name="phone" /></Field>
            <Field label="Reference"><Input name="reference" /></Field>
            <Button type="submit">Collect / Request payment</Button>
          </form>
          {!inv.paymentPlan ? (
            <form action={splitInstallmentsAction} className="mt-6 grid gap-3">
              <input type="hidden" name="invoiceId" value={inv.id} />
              <Field label="Installments"><Input name="count" type="number" defaultValue={3} min={2} /></Field>
              <Button variant="secondary" type="submit">Split into installments</Button>
            </form>
          ) : (
            <div className="mt-6 text-sm">
              {inv.paymentPlan.installments.map((i) => (
                <p key={i.id}>#{i.number} {ksh(i.amountCents)} · {i.status}</p>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
