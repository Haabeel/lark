import { betterFetch } from "@better-fetch/fetch";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { type Session } from "./lib/auth";

export default async function middleware(req: NextRequest) {
  const authRoutes = ["/sign-up", "/sign-in"];
  const pathname = req.nextUrl.pathname;
  const session = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: req.nextUrl.origin,
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
  });
  if (pathname === "/") return NextResponse.next();
  if (session.data && authRoutes.includes(pathname))
    return NextResponse.redirect(new URL("/", req.url));

  if (!session.data && pathname === "/commits") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (pathname === "/sign-up/verification") {
    if (!session.data) {
      return NextResponse.redirect(new URL("/sign-up", req.url)); // Redirect if not signed in
    }
    // Check if user has verified their email
    if (session.data.user.emailVerified)
      return NextResponse.redirect(new URL("/dashboard", req.url)); // Redirect if already verified
    return NextResponse.next(); // Allow access if email is not verified
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
