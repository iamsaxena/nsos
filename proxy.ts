import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const csp = [
    "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://translate.google.com https://translate.googleapis.com https://checkout.razorpay.com",
    "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://api.razorpay.com https://*.razorpay.com",
    "img-src 'self' data: blob: https://www.google.com https://*.googleusercontent.com https://api.qrserver.com",
    "style-src 'self' 'unsafe-inline' https://translate.googleapis.com", "font-src 'self' data:",
    "frame-src https://api.razorpay.com https://*.razorpay.com", "upgrade-insecure-requests",
  ].join("; ");
  response.headers.set("content-security-policy", csp);
  response.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  response.headers.set("cross-origin-opener-policy", "same-origin-allow-popups");
  if (request.nextUrl.pathname.startsWith("/api/")) response.headers.set("cache-control", "no-store");
  return response;
}

export const config = { matcher: "/((?!_next/static|_next/image|favicon.svg).*)" };
