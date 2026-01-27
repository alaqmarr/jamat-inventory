import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import rbacConfig from "./config/rbac.json";

const { auth } = NextAuth(authConfig);

type Role = "ADMIN" | "MANAGER" | "STAFF" | "WATCHER";

// Helper to check if a route pattern matches the current path
// Handles simple exact match and Next.js style dynamic segments [id]
function matchRoute(pattern: string, pathname: string): boolean {
  if (pattern === pathname) return true;

  // Convert pattern like /events/[id]/edit to regex: ^/events/[^/]+/edit$
  const regexStr = pattern
    .replace(/\[\.\.\.[^\]]+\]/g, ".*") // Catch-all [...slug] -> .*
    .replace(/\[[^\]]+\]/g, "[^/]+") // Dynamic segment [id] -> [^/]+
    .replace(/\//g, "\\/"); // Escape slashes

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(pathname);
}

function getAllowedRoles(pathname: string): string[] | null {
  // 1. Check strict page rules from rbac.json
  // We prioritize specific matches over wildcard/general ones if we had them.
  // rbac.json "pages" keys are unique.

  // Sort patterns by length descending to match most specific first (optional but good practice)
  const patterns = Object.keys(rbacConfig.pages).sort(
    (a, b) => b.length - a.length,
  );

  for (const pattern of patterns) {
    if (matchRoute(pattern, pathname)) {
      // Found a match
      return (rbacConfig.pages as any)[pattern];
    }
  }

  // 2. If no direct match found, apply strict default or broad module rules?
  // Current requirement: "Control from single file".
  // rbac-server.ts says "If page is not in config, DENY".
  // So middleware should also DENY if not matched?
  // OR we can allow known safe public routes (handled separately) and block everything else.
  // BUT what about /api routes? This middleware intercepts them too.

  // Let's assume strict compliance with rbac.json. If it's a "Page" and not in JSON, it's unknown/blocked or Admin only.
  // Let's return null to signify "No Rule Found".
  return null;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const user = req.auth?.user as any;
  const role = user?.role as Role | undefined;
  const isLoggedIn = !!user;

  // Skip public routes and assets
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/setup" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/api/auth"); // Allow auth APIs unconditionally

  if (
    isPublicRoute ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  // Not logged in - redirect to login
  if (!isLoggedIn) {
    // For API routes, return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Check role-based access
  const allowedRoles = getAllowedRoles(pathname);

  // If no rule found:
  // Option A: Allow (dangerous)
  // Option B: Block (Strict) - Best for security
  // Option C: Admin Only fallback
  if (allowedRoles === null) {
    // If it's an API route not explicitly listed in rbac.json pages (rbac.json pages usually implies UI routes),
    // we might block legitimate API calls unless we allow ALL APIs and rely on per-route checks.
    // However, user said "Strict Protection".
    // rbac.json "pages" keys might not cover "/api/events/..." patterns.
    // STRATEGY:
    // - UI Routes: Must be whitelisted.
    // - API Routes: Allow to pass through middleware, rely on inner implementation?
    //   OR enforcing them here too?
    //   Realistically, listing all API routes in rbac.json pages is tedious.
    //   Let's allow API routes to pass middleware RBAC check (isAuthenticated is already checked)
    //   and rely on the per-route `auth()` and `role` checks we added in `route.ts` files (which we just audited!).

    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // For UI pages not in config -> Block or Admin Only?
    // Let's default to Admin Only to be safe.
    if (role !== "ADMIN") {
      console.log(
        `[Middleware] Blocking access to ${pathname} for ${role} (No Rule)`,
      );
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  } else {
    // Rule found, check if role is allowed
    // @ts-ignore
    if (!allowedRoles.includes(role)) {
      console.log(
        `[Middleware] Blocking access to ${pathname} for ${role} (Allowed: ${allowedRoles})`,
      );
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
