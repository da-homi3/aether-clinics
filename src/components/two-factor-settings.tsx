"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { beginTotpSetupAction, confirmTotpSetupAction, disableTotpAction } from "@/lib/actions";
import { Button, Field, Input } from "@/components/ui";

export function TwoFactorSettings({ enabled }: Readonly<{ enabled: boolean }>) {
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Status: <span className="font-semibold text-ink">{enabled ? "Enabled" : "Disabled"}</span>
      </p>
      {!enabled ? (
        <>
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await beginTotpSetupAction();
                setQr(res.qrDataUrl);
                setMessage("Scan the QR code, then confirm with a 6-digit code.");
                setError(null);
              })
            }
          >
            Start 2FA enrollment
          </Button>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Authenticator QR code" className="h-44 w-44 rounded-xl border bg-white p-2" />
          ) : null}
          {qr ? (
            <form
              className="grid max-w-xs gap-3"
              action={(fd) =>
                startTransition(async () => {
                  const res = await confirmTotpSetupAction(fd);
                  if (res?.error) setError(res.error);
                  else {
                    setMessage("Two-factor authentication is now enabled.");
                    setError(null);
                    setQr(null);
                    router.refresh();
                  }
                })
              }
            >
              <Field label="Verification code">
                <Input name="code" inputMode="numeric" maxLength={6} required placeholder="000000" />
              </Field>
              <Button type="submit" disabled={pending}>
                Confirm and enable
              </Button>
            </form>
          ) : null}
        </>
      ) : (
        <form
          className="grid max-w-xs gap-3"
          action={(fd) =>
            startTransition(async () => {
              const res = await disableTotpAction(fd);
              if (res?.error) setError(res.error);
              else {
                setMessage("Two-factor authentication disabled.");
                setError(null);
                router.refresh();
              }
            })
          }
        >
          <Field label="Code to disable 2FA">
            <Input name="code" inputMode="numeric" maxLength={6} required placeholder="000000" />
          </Field>
          <Button type="submit" variant="danger" disabled={pending}>
            Disable 2FA
          </Button>
        </form>
      )}
      {message ? <p className="text-sm text-ok">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
