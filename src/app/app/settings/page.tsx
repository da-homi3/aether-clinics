import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { savePlatformSettingsAction } from "@/lib/actions";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import { TwoFactorSettings } from "@/components/two-factor-settings";

export default async function SettingsPage() {
  const user = await requireUser();
  const canBrand = user.isOwner || user.permissions.includes("settings.manage");
  const s = canBrand ? await prisma.platformSetting.findUnique({ where: { id: "platform" } }) : null;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return (
    <div>
      <SectionBanner
        image="clinicInterior"
        title="System settings"
        subtitle="Security for your account, plus branding for administrators."
        height="sm"
      />
      <PageHeader title="Settings" subtitle="Security and platform configuration." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="max-w-xl">
          <h3 className="mb-3 font-semibold">Two-factor authentication</h3>
          <TwoFactorSettings enabled={Boolean(dbUser?.totpEnabled)} />
        </Card>
        {canBrand ? (
          <Card className="max-w-xl">
            <h3 className="mb-3 font-semibold">Branding</h3>
            <form action={savePlatformSettingsAction} className="grid gap-3">
              <Field label="Platform name"><Input name="name" defaultValue={s?.name} /></Field>
              <Field label="Primary color"><Input name="primaryColor" defaultValue={s?.primaryColor} /></Field>
              <Field label="Secondary color"><Input name="secondaryColor" defaultValue={s?.secondaryColor} /></Field>
              <Field label="Receipt footer"><Textarea name="receiptFooter" defaultValue={s?.receiptFooter || ""} /></Field>
              <Field label="Invoice footer"><Textarea name="invoiceFooter" defaultValue={s?.invoiceFooter || ""} /></Field>
              <Button type="submit">Save</Button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
