export function EmptyIllustration({ kind = "clinic" }: Readonly<{ kind?: "clinic" | "calendar" | "bell" | "stock" }>) {
  const palette = {
    clinic: { a: "#0f766e", b: "#99f6e4", c: "#ccfbf1" },
    calendar: { a: "#0369a1", b: "#7dd3fc", c: "#e0f2fe" },
    bell: { a: "#a16207", b: "#fde68a", c: "#fffbeb" },
    stock: { a: "#6d28d9", b: "#c4b5fd", c: "#ede9fe" },
  }[kind];

  return (
    <svg viewBox="0 0 320 160" className="mb-5 h-36 w-full max-w-sm" role="img" aria-label="Empty state illustration">
      <rect width="320" height="160" rx="24" fill={palette.c} />
      <circle cx="250" cy="40" r="28" fill={palette.b} opacity="0.7" />
      <rect x="40" y="48" width="160" height="84" rx="16" fill="white" />
      <rect x="56" y="64" width="88" height="10" rx="5" fill={palette.a} opacity="0.85" />
      <rect x="56" y="84" width="120" height="8" rx="4" fill={palette.b} />
      <rect x="56" y="102" width="72" height="8" rx="4" fill={palette.b} opacity="0.7" />
      <circle cx="210" cy="108" r="22" fill={palette.a} />
      <path d="M202 108h16M210 100v16" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
