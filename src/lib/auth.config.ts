import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/");
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnForgotPassword =
        nextUrl.pathname.startsWith("/forgot-password");
      const isOnSetup = nextUrl.pathname.startsWith("/setup");
      const isOnApi = nextUrl.pathname.startsWith("/api");

      // Allow API routes (they handle their own auth or are public like /api/setup)
      if (isOnApi) return true;

      // Allow Setup page
      if (isOnSetup) return true;

      if (isOnDashboard) {
        if (isOnLogin) return true; // Allow login page
        if (isOnForgotPassword) return true; // Allow forgot password page
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // Redirect authenticated users to dashboard if they try to access login
        return true;
      }
      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;
