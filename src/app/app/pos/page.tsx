import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { posSaleAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";

export default async function PosPage() {
  const user = await requirePermission("inventory.sell");
  const products = await prisma.product.findMany({ include: { batches: true }, take: 200 });
  const patients = await prisma.patient.findMany({ take: 200 });
  const clinics = await prisma.clinic.findMany();
  return (
    <div>
      <SectionBanner
        image="medicineCloseup"
        title="Clinic POS"
        subtitle="Search, sell and deduct stock in one confirmed transaction."
        height="sm"
      />
      <PageHeader title="Point of sale" subtitle="Stock is deducted only after a successful sale." />
      <Card className="max-w-xl">
        <form action={posSaleAction} className="grid gap-3">
          <Field label="Clinic">
            <Select name="clinicId" defaultValue={user.clinicId || clinics[0]?.id}>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Product">
            <Select name="productId">
              {products.map((product) => {
                const qty = product.batches.reduce((sum, batch) => sum + batch.quantity, 0);
                return (
                  <option key={product.id} value={product.id}>
                    {`${product.name} (${qty})`}
                  </option>
                );
              })}
            </Select>
          </Field>
          <Field label="Quantity">
            <Input name="quantity" type="number" defaultValue={1} min={1} />
          </Field>
          <Field label="Discount KES">
            <Input name="discount" type="number" defaultValue={0} />
          </Field>
          <Field label="Patient">
            <Select name="patientId">
              <option value="">Walk-in</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment method">
            <Select name="method">
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
            </Select>
          </Field>
          <Button type="submit">Complete sale</Button>
        </form>
      </Card>
    </div>
  );
}
