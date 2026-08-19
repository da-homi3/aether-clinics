import Image from "next/image";
import Link from "next/link";
import { featureVisuals, images, moduleVisuals } from "@/lib/images";
import { SoftPhotoCard } from "@/components/section-visual";

export default function LandingPage() {
  return (
    <div className="bg-bg text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="font-semibold">Aether Clinics</div>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm">
            Sign in
          </Link>
          <Link href="/login" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
            Get Started
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-6">
        <div className="relative h-hero w-full overflow-hidden rounded-3xl">
          <Image
            src={images.heroConsultation}
            alt="Modern clinic consultation"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/20 p-10 text-white">
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              Manage Every Clinic. Every Patient. Every Payment. From One Powerful Platform.
            </h1>
            <p className="mt-4 max-w-xl text-white/80">
              A complete healthcare operations platform for appointments, patient records, consultations, billing,
              payments, inventory and multi-branch management.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-xl bg-white px-5 py-3 font-semibold text-black">
                Get Started
              </Link>
              <Link href="#platform" className="rounded-xl border border-white/40 px-5 py-3">
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto grid max-w-6xl gap-4 px-6 py-16 sm:grid-cols-3">
        {featureVisuals.map((f) => (
          <SoftPhotoCard key={f.title} src={f.src} alt={f.alt} title={f.title} body={f.body} />
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="relative overflow-hidden rounded-3xl border">
          <div className="relative h-56 w-full sm:h-72">
            <Image
              src={images.clinicInterior}
              alt="Bright modern clinic corridor"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50 p-8 text-white sm:p-10">
              <h2 className="max-w-lg text-2xl font-semibold sm:text-3xl">Built for private healthcare groups</h2>
              <p className="mt-3 max-w-md text-sm text-white/85">
                From front desk check-in to pharmacy dispensing and owner analytics — one secure operations layer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl font-semibold">Platform capabilities</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {moduleVisuals.map((m) => (
            <SoftPhotoCard key={m.label} src={m.src} alt={m.alt} title={m.label} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 lg:grid-cols-2">
        <div className="relative min-h-64 overflow-hidden rounded-3xl">
          <Image src={images.pharmacy} alt="Pharmacy inventory shelves" fill className="object-cover" sizes="50vw" />
          <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/70 to-transparent p-6 text-white">
            <div>
              <p className="font-semibold">Pharmacy & inventory control</p>
              <p className="mt-1 text-sm text-white/80">Expiry, low stock, transfers and POS in one flow.</p>
            </div>
          </div>
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-3xl">
          <Image src={images.laboratory} alt="Clinical laboratory workspace" fill className="object-cover" sizes="50vw" />
          <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/70 to-transparent p-6 text-white">
            <div>
              <p className="font-semibold">Clinical records that stay private</p>
              <p className="mt-1 text-sm text-white/80">Role-based access keeps diagnoses with clinicians.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16" id="contact">
        <div className="overflow-hidden rounded-3xl border bg-surface">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-48 md:min-h-full">
              <Image src={images.nurseCare} alt="Healthcare professional" fill className="object-cover" sizes="50vw" />
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-semibold">FAQ</h2>
              <p className="mt-3 text-sm text-muted">
                Demo login: owner@aetherclinics.ke / Demo1234! — try reception, doctor and pharmacy roles with the same
                password.
              </p>
              <Link href="/login" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white">
                Open the platform
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
