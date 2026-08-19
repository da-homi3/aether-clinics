"use client";

import { Button } from "./ui";

export function PrintButton({ className }: Readonly<{ className?: string }>) {
  return (
    <Button type="button" variant="secondary" className={className ?? "mt-4 no-print"} onClick={() => window.print()}>
      Print
    </Button>
  );
}
