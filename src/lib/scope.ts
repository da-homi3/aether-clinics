import type { SessionUser } from "./auth";
import { cookies } from "next/headers";

export const CLINIC_COOKIE = "aether_clinic";

export async function getSelectedClinicId(user: Readonly<SessionUser>) {
  const jar = await cookies();
  const selected = jar.get(CLINIC_COOKIE)?.value || "all";
  if (!user.isOwner && user.clinicId) return user.clinicId;
  if (selected === "all") return null;
  return selected;
}

export function clinicWhere(clinicId: string | null) {
  return clinicId ? { clinicId } : {};
}
