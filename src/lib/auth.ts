import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/firebase";
import { User } from "@/types";
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

        try {
          const userSnapshot = await db
            .collection("users")
            .where("username", "==", username)
            .limit(1)
            .get();

          if (userSnapshot.empty) {
            return null;
          }

          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data() as User;

          // Verify password
          if ((userData as any).password !== credentials.password) {
            return null;
          }

          return {
            id: userDoc.id,
            email: userData.email,
            name: userData.name || userData.username,
            role: userData.role,
            profileStatus: userData.profileStatus,
            mobile: userData.mobile,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials" && user) {
        // Log successful login
        try {
          const { logAction } = await import("@/lib/logger");
          await logAction(
            "USER_LOGIN",
            { loginMethod: "credentials" },
            { id: user.id as string, name: user.name || "Unknown" }
          );
        } catch (error) {
          console.error("Failed to log login action:", error);
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.profileStatus = (user as any).profileStatus;
        token.mobile = (user as any).mobile;
      }

      // Self-heal: If profileStatus is missing (e.g. old session), fetch it from DB
      if (!token.profileStatus && token.id) {
        try {
          const userDoc = await db
            .collection("users")
            .doc(token.id as string)
            .get();
          if (userDoc.exists) {
            const userData = userDoc.data() as User;
            token.profileStatus = userData.profileStatus;
            token.mobile = userData.mobile; // Also fetch mobile if missing
          }
        } catch (error) {
          console.error(
            "Failed to fetch user profile status in JWT callback",
            error
          );
        }
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).profileStatus = token.profileStatus;
        (session.user as any).mobile = token.mobile;
      }
      return session;
    },
    ...authConfig.callbacks, // Keep authorized callback
  },
});
