import { cn } from "@/lib/cn";
import Image from "next/image";
import { EmptyIllustration } from "@/components/empty-illustration";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", type = "button", ...props }: Readonly<ButtonProps>) {
  const styles = {
    primary: "bg-accent text-white hover:opacity-90",
    secondary: "bg-surface-2 text-ink hover:opacity-90",
    ghost: "bg-transparent hover:bg-surface-2",
    danger: "bg-danger text-white",
  };
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input(props: Readonly<React.InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <input
      className="min-h-11 w-full rounded-xl border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
      {...props}
    />
  );
}

export function Select(props: Readonly<React.SelectHTMLAttributes<HTMLSelectElement>>) {
  return (
    <select
      className="min-h-11 w-full rounded-xl border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
      {...props}
    />
  );
}

export function Textarea(props: Readonly<React.TextareaHTMLAttributes<HTMLTextAreaElement>>) {
  return (
    <textarea
      className="w-full rounded-xl border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
      {...props}
    />
  );
}

export function Card({ className, ...props }: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn("rounded-2xl border bg-surface p-5 shadow-card", className)} {...props} />;
}

export function Badge({
  children,
  tone = "neutral",
}: Readonly<{
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger" | "info";
}>) {
  const map = {
    neutral: "bg-surface-2 text-muted",
    ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    danger: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize", map[tone])}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: Readonly<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}>) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  imageSrc,
  imageAlt = "Healthcare illustration",
  illustration,
}: Readonly<{
  title: string;
  body: string;
  imageSrc?: string;
  imageAlt?: string;
  illustration?: "clinic" | "calendar" | "bell" | "stock";
}>) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-surface px-6 py-12 text-center">
      {imageSrc ? (
        <div className="relative mb-5 h-36 w-full max-w-sm overflow-hidden rounded-2xl">
          <Image src={imageSrc} alt={imageAlt} fill sizes="400px" className="object-cover" />
        </div>
      ) : (
        <EmptyIllustration kind={illustration || "clinic"} />
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}

export function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
