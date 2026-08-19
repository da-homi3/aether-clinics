export function invoiceStatusTone(status: string): "ok" | "danger" | "warn" {
  if (status === "paid") return "ok";
  if (status === "overdue") return "danger";
  return "warn";
}

export function appointmentStatusTone(status: string): "ok" | "danger" | "info" {
  if (status === "completed") return "ok";
  if (status === "cancelled") return "danger";
  return "info";
}

export function expiryTone(days: number): "danger" | "warn" | "info" {
  if (days < 0) return "danger";
  if (days <= 30) return "warn";
  return "info";
}

export function dashboardTitle(role: string) {
  if (role === "Doctor") return "Doctor command center";
  if (role === "Receptionist") return "Reception desk";
  return "Dashboard";
}
