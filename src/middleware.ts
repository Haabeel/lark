import { betterFetch } from "@better-fetch/fetch";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { type Session } from "./lib/auth";

export default async function middleware(req: NextRequest) {
  const authPaths = ["/sign-up", "/sign-in"];
  const protectedPathsPrefix = "/dashboard";
  const emailVerificationPath = "/sign-up/verification";
  const pathname = req.nextUrl.pathname;
  const session = await betterFetch<Session>("/api/auth/get-session", {
    baseURL: req.nextUrl.origin,
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
  });
  const hasSession = !!session.data;
  const isEmailVerified = session.data?.user.emailVerified;
  if (pathname === "/") {
    return NextResponse.next();
  }
  // 1. Handle redirection for authenticated users trying to access auth pages
  if (hasSession && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL(protectedPathsPrefix, req.url)); // Redirect to dashboard
  }

  // 2. Handle email verification path
  if (pathname === emailVerificationPath) {
    if (!hasSession) {
      // Not signed in, trying to access verification page -> redirect to sign-up
      return NextResponse.redirect(new URL("/sign-up", req.url));
    }
    if (isEmailVerified) {
      // Signed in and email already verified -> redirect to dashboard
      return NextResponse.redirect(new URL(protectedPathsPrefix, req.url));
    }
    // Signed in but email not verified -> allow access to verification page
    return NextResponse.next();
  }

  // 3. Protect routes under /dashboard
  if (pathname.startsWith(protectedPathsPrefix)) {
    if (!hasSession) {
      // Not signed in, trying to access a protected dashboard route
      // Redirect to sign-in, and include a callbackUrl to return after login
      const signInUrl = new URL("/sign-in", req.url);
      return NextResponse.redirect(signInUrl);
    }
    if (!isEmailVerified) {
      // Signed in but email not verified, trying to access dashboard
      // Redirect to email verification page
      const verificationUrl = new URL(emailVerificationPath, req.url);
      // Optionally, add a callbackUrl here too if verification page can redirect back
      // verificationUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(verificationUrl);
    }
    // User has session and email is verified -> allow access to dashboard routes
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
