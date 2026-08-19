"use client";

import { loginAction, verifyTotpLoginAction } from "@/lib/actions";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { images } from "@/lib/images";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending2fa, setPending2fa] = useState<{ userId: string } | null>(null);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <Image
          src={images.doctorTeam}
          alt="Healthcare professionals collaborating in a modern clinic"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45 p-12 text-white">
          <p className="text-sm uppercase tracking-widest">Aether Clinics</p>
          <h1 className="mt-40 max-w-md text-4xl font-semibold">One platform for every branch.</h1>
          <p className="mt-4 max-w-sm text-sm text-white/80">
            Appointments, clinical records, billing and inventory — designed for serious private healthcare groups.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        {pending2fa ? (
          <form
            className="w-full max-w-sm space-y-4"
            action={async (fd) => {
              const res = await verifyTotpLoginAction(fd);
              if (res?.error) setError(res.error);
            }}
          >
            <h2 className="text-2xl font-semibold">Authenticator code</h2>
            <p className="text-sm text-muted">Enter the 6-digit code from your authenticator app.</p>
            <input type="hidden" name="userId" value={pending2fa.userId} />
            <Input name="code" inputMode="numeric" pattern="[0-9]*" maxLength={6} required placeholder="000000" autoFocus />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full">
              Verify and continue
            </Button>
            <button type="button" className="w-full text-sm text-muted" onClick={() => { setPending2fa(null); setError(null); }}>
              Back to password
            </button>
          </form>
        ) : (
          <form
            className="w-full max-w-sm space-y-4"
            action={async (fd) => {
              const res = await loginAction(fd);
              if (res?.error) {
                setError(res.error);
                return;
              }
              if (res?.requires2fa && res.userId) {
                setError(null);
                setPending2fa({ userId: res.userId });
              }
            }}
          >
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted">Use your staff email. Demo: owner@aetherclinics.ke / Demo1234!</p>
            <Input name="email" type="email" required placeholder="Email" />
            <Input name="password" type="password" required placeholder="Password" />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full">
              Continue
            </Button>
            <Link href="/forgot-password" className="block text-center text-sm text-accent">
              Forgot password
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
