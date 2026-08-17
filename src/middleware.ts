import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/assistant", "/tasks", "/calendar", "/notes", "/memories", "/documents", "/automations", "/focus", "/settings"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/assistant/:path*", "/tasks/:path*", "/calendar/:path*", "/notes/:path*", "/memories/:path*", "/documents/:path*", "/automations/:path*", "/focus/:path*", "/settings/:path*"],
};
