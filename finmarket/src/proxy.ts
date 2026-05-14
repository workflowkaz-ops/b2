import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/catalog(.*)",
  "/verify/(.*)",
  "/about",
  "/contact",
  "/api/v1/listings",
  "/api/v1/verify/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized"
]);

const isDealerRoute = createRouteMatcher(["/dashboard/dealer(.*)"]);
const isLCRoute = createRouteMatcher(["/dashboard/lc(.*)"]);
const isClientRoute = createRouteMatcher(["/dashboard/client(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const authObject = await auth();

  if (!authObject.userId) {
    return authObject.redirectToSignIn({ returnBackUrl: req.url });
  }

  // Type assertion for session claims
  const claims = authObject.sessionClaims as Record<string, unknown>;
  const metadata = claims?.metadata as Record<string, unknown> | undefined;
  const role = metadata?.role as string | undefined;

  if (isDealerRoute(req) && role !== "DEALER_BOSS" && role !== "DEALER_MANAGER") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isLCRoute(req) && role !== "LC_BOSS" && role !== "LC_AGENT") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isClientRoute(req) && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (isAdminRoute(req) && role !== "GLOBAL_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.redirect(new URL("/unauthorized", req.url));
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
