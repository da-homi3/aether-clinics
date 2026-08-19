export const PERMISSIONS = [
  "patients.view",
  "patients.create",
  "patients.edit",
  "appointments.view",
  "appointments.create",
  "appointments.edit",
  "consultations.view",
  "consultations.create",
  "inventory.view",
  "inventory.create",
  "inventory.edit",
  "inventory.sell",
  "billing.view",
  "billing.create",
  "payments.create",
  "reports.view",
  "staff.manage",
  "settings.manage",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const ROLE_DEFAULTS: Record<string, PermissionKey[]> = {
  "Super Admin": [...PERMISSIONS],
  "Clinic Manager": [
    "patients.view",
    "patients.create",
    "patients.edit",
    "appointments.view",
    "appointments.create",
    "appointments.edit",
    "consultations.view",
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.sell",
    "billing.view",
    "billing.create",
    "payments.create",
    "reports.view",
    "staff.manage",
    "settings.manage",
  ],
  Receptionist: [
    "patients.view",
    "patients.create",
    "patients.edit",
    "appointments.view",
    "appointments.create",
    "appointments.edit",
    "inventory.view",
    "inventory.sell",
    "billing.view",
    "billing.create",
    "payments.create",
  ],
  Doctor: [
    "patients.view",
    "appointments.view",
    "appointments.create",
    "appointments.edit",
    "consultations.view",
    "consultations.create",
  ],
  Pharmacist: [
    "inventory.view",
    "inventory.create",
    "inventory.edit",
    "inventory.sell",
    "patients.view",
  ],
  Accountant: [
    "billing.view",
    "billing.create",
    "payments.create",
    "reports.view",
  ],
};

export function can(keys: readonly string[], permission: PermissionKey) {
  return keys.includes(permission);
}
