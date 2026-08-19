import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");
const COOKIE = "aether_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  clinicId: string | null;
  isOwner: boolean;
  permissions: string[];
};

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .setIssuedAt()
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const user = await prisma.user.findUnique({
      where: { id: String(payload.sub) },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (user?.status !== "active") return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      clinicId: user.clinicId,
      isOwner: user.isOwner || user.role.name === "Super Admin",
      permissions: user.role.permissions.map((rp: { permission: { key: string } }) => rp.permission.key),
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(key: string) {
  const user = await requireUser();
  if (user.isOwner) return user;
  if (!user.permissions.includes(key)) redirect("/app?denied=1");
  return user;
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
