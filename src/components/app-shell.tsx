"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction, setClinicAction } from "@/lib/actions";
import { useTheme } from "./theme-provider";
import { Bell, Calendar, LayoutDashboard, LogOut, Menu, Search, Stethoscope, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRealtimeSnapshot } from "@/hooks/use-realtime";

const NAV = [
  { group: "Overview", items: [{ href: "/app", label: "Dashboard" }, { href: "/app/business", label: "Business Overview" }] },
  { group: "Clinics", items: [{ href: "/app/clinics", label: "All Clinics" }, { href: "/app/clinics/performance", label: "Clinic Performance" }, { href: "/app/clinics/new", label: "Add Clinic" }] },
  { group: "Patients", items: [{ href: "/app/patients", label: "All Patients" }, { href: "/app/patients/new", label: "Add Patient" }] },
  { group: "Appointments", items: [{ href: "/app/appointments/calendar", label: "Calendar" }, { href: "/app/appointments", label: "All appointments" }, { href: "/app/appointments/today", label: "Today" }, { href: "/app/appointments/upcoming", label: "Upcoming" }, { href: "/app/appointments/completed", label: "Completed" }, { href: "/app/appointments/cancelled", label: "Cancelled" }] },
  { group: "Clinical", items: [{ href: "/app/clinical/consultations", label: "Consultations" }, { href: "/app/clinical/records", label: "Medical Records" }, { href: "/app/clinical/prescriptions", label: "Prescriptions" }, { href: "/app/clinical/treatments", label: "Treatment Plans" }, { href: "/app/clinical/sessions", label: "Sessions" }] },
  { group: "Billing", items: [{ href: "/app/billing/invoices", label: "Invoices" }, { href: "/app/billing/payments", label: "Payments" }, { href: "/app/billing/installments", label: "Installments" }, { href: "/app/billing/outstanding", label: "Outstanding" }, { href: "/app/billing/expenses", label: "Expenses" }] },
  { group: "POS", items: [{ href: "/app/pos", label: "New Sale" }, { href: "/app/pos/history", label: "Sales History" }, { href: "/app/pos/receipts", label: "Receipts" }] },
  { group: "Inventory", items: [{ href: "/app/inventory", label: "Products" }, { href: "/app/inventory/medicines", label: "Medicines" }, { href: "/app/inventory/equipment", label: "Equipment" }, { href: "/app/inventory/stock", label: "Stock" }, { href: "/app/inventory/purchases", label: "Purchases" }, { href: "/app/inventory/transfers", label: "Transfers" }, { href: "/app/inventory/suppliers", label: "Suppliers" }, { href: "/app/inventory/expiry", label: "Expiry" }, { href: "/app/inventory/low-stock", label: "Low Stock" }] },
  { group: "Staff", items: [{ href: "/app/staff", label: "Staff" }, { href: "/app/staff/roles", label: "Roles" }, { href: "/app/staff/schedules", label: "Schedules" }] },
  { group: "Reports", items: [{ href: "/app/reports", label: "All Reports" }] },
  { group: "System", items: [{ href: "/app/notifications", label: "Notifications" }, { href: "/app/audit", label: "Audit Logs" }, { href: "/app/settings", label: "Settings" }] },
];

export function AppShell({
  children,
  user,
  clinics,
  selectedClinic,
  unread,
}: Readonly<{
  children: React.ReactNode;
  user: { name: string; role: string; isOwner: boolean };
  clinics: { id: string; name: string }[];
  selectedClinic: string;
  unread: number;
}>) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useState(false);
  const { theme, setTheme } = useTheme();
  const { unread: liveUnread, live } = useRealtimeSnapshot(unread);
  const badgeCount = liveUnread;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nav = (
    <nav className="space-y-5 pb-20">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="mb-2 px-3 text-2xs font-semibold uppercase tracking-wider text-muted">{g.group}</p>
          <div className="space-y-0.5">
            {g.items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-3 py-2 text-sm ${path === i.href ? "bg-accent text-white" : "hover:bg-surface-2"}`}
              >
                {i.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto border-r bg-surface p-4 lg:block">
        <Link href="/app" className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold">
          <Stethoscope className="h-5 w-5 text-accent" />
          Aether Clinics
        </Link>
        {nav}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 overflow-y-auto bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="mb-4" onClick={() => setOpen(false)} aria-label="Close menu">
              <X />
            </button>
            {nav}
          </aside>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-surface/90 px-4 py-3 backdrop-blur">
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <form action={async (fd) => setClinicAction(String(fd.get("clinicId")))}>
            <select
              name="clinicId"
              defaultValue={selectedClinic}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="rounded-xl border bg-bg px-3 py-2 text-sm"
              aria-label="Clinic switcher"
            >
              {user.isOwner ? <option value="all">All Clinics</option> : null}
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </form>
          <button type="button" onClick={() => setCmd(true)} className="hidden flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm text-muted md:flex">
            <Search className="h-4 w-4" /> Search or jump (Ctrl+K)
          </button>
          <select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")} className="rounded-xl border bg-bg px-2 py-2 text-sm" aria-label="Theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <Link href="/app/notifications" className="relative rounded-xl border p-2" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {badgeCount > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-danger px-1.5 text-3xs text-white">{badgeCount}</span> : null}
            {live ? <span className="absolute -bottom-0.5 -left-0.5 h-2 w-2 rounded-full bg-ok" title="Live updates connected" /> : null}
          </Link>
          <div className="hidden text-right text-xs sm:block">
            <div className="font-semibold">{user.name}</div>
            <div className="text-muted">{user.role}</div>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="rounded-xl border p-2" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </header>
        <main className="p-4 pb-24 sm:p-6">{children}</main>
        <MobileNav role={user.role} />
      </div>
      {cmd ? <CommandPalette onClose={() => setCmd(false)} /> : null}
    </div>
  );
}

function MobileNav({ role }: Readonly<{ role: string }>) {
  const items =
    role === "Receptionist"
      ? [
          { href: "/app/reception", label: "Desk", icon: LayoutDashboard },
          { href: "/app/patients/new", label: "Register" },
          { href: "/app/appointments/today", label: "Today", icon: Calendar },
          { href: "/app/pos", label: "Sale" },
        ]
      : [
          { href: "/app", label: "Home", icon: LayoutDashboard },
          { href: "/app/appointments/today", label: "Today", icon: Calendar },
          { href: "/app/patients", label: "Patients" },
          { href: "/app/pos", label: "POS" },
        ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t bg-surface p-2 lg:hidden">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className="rounded-xl py-2 text-center text-xs font-medium">
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

function CommandPalette({ onClose }: Readonly<{ onClose: () => void }>) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const commands = useMemo(
    () =>
      [
        { label: "Add patient", href: "/app/patients/new" },
        { label: "Create appointment", href: "/app/appointments/new" },
        { label: "New sale", href: "/app/pos" },
        { label: "Collect payment", href: "/app/billing/outstanding" },
        { label: "Inventory", href: "/app/inventory" },
        { label: "Calendar", href: "/app/appointments" },
        { label: "Reports", href: "/app/reports" },
      ].filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={onClose}>
      <div className="mx-auto mt-24 max-w-lg rounded-2xl border bg-surface p-3" onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to..." className="w-full rounded-xl border px-3 py-2" />
        <div className="mt-2">
          {commands.map((c) => (
            <button
              type="button"
              key={c.href}
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-surface-2"
              onClick={() => {
                router.push(c.href);
                onClose();
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
