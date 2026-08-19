import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { SectionBanner } from "@/components/section-visual";
import Link from "next/link";

export default async function Reception() {
  await requireUser();
  const actions = [
    ["/app/patients/new", "REGISTER PATIENT"],
    ["/app/appointments/new", "BOOK APPOINTMENT"],
    ["/app/appointments/today", "CHECK IN"],
    ["/app/billing/outstanding", "COLLECT PAYMENT"],
    ["/app/pos", "NEW SALE"],
    ["/app/appointments/today", "VIEW TODAY'S APPOINTMENTS"],
  ];
  return (
    <div>
      <SectionBanner
        image="receptionist"
        title="Front desk, built for speed"
        subtitle="Register, book, check in, collect payment and sell — in a few taps."
        height="md"
      />
      <PageHeader title="Reception command center" />
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map(([href, label]) => (
          <Link key={label} href={href} className="rounded-2xl bg-accent px-4 py-8 text-center text-sm font-bold text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
