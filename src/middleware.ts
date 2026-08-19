import { NextRequest, NextResponse } from "next/server";

export function middleware(req: Readonly<NextRequest>) {
  const token = req.cookies.get("aether_session")?.value;
  if (req.nextUrl.pathname.startsWith("/app") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*"] };
