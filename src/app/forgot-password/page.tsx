"use client";

import { requestPasswordResetAction } from "@/lib/actions";
import { Button, Input } from "@/components/ui";
import { useState } from "react";

export default function ForgotPage() {
  const [ok, setOk] = useState(false);
  return (
    <div className="mx-auto max-w-sm p-10">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <form
        className="mt-6 space-y-3"
        action={async (fd) => {
          await requestPasswordResetAction(fd);
          setOk(true);
        }}
      >
        <Input name="email" type="email" required placeholder="Work email" />
        <Button type="submit" className="w-full">
          Send reset instructions
        </Button>
      </form>
      {ok ? <p className="mt-4 text-sm">If an account exists, a reset notice was queued for the email provider integration.</p> : null}
    </div>
  );
}
