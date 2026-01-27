import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        try {
          // Find user by username using Prisma
          const user = await prisma.user.findUnique({
            where: { username },
          });

          if (!user) {
            return null;
          }

          // Verify password - support both plain text (legacy) and hashed
          let isValidPassword = false;

          // Check if password is hashed (bcrypt hashes start with $2)
          if (user.password.startsWith("$2")) {
            isValidPassword = await bcrypt.compare(password, user.password);
          } else {
            // Legacy plain text comparison (for migration period)
            isValidPassword = user.password === password;
          }

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.username,
            username: user.username,
            role: user.role,
            profileStatus: user.profileStatus,
            mobile: user.mobile,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "credentials" && user) {
        try {
          // Keep logging via Firebase RTDB for real-time updates
          const { logAction } = await import("@/lib/logger");
          await logAction(
            "USER_LOGIN",
            { loginMethod: "credentials" },
            { id: user.id as string, name: user.name || "Unknown" },
          );
        } catch (error) {
          console.error("Failed to log login action:", error);
        }
        return true;
      }
      return true;
    },
  },
});
