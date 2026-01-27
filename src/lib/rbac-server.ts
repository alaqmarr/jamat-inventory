import { auth } from "@/lib/auth";
import rbacConfig from "@/config/rbac.json";
import { Role } from "@/generated/prisma/client";

type PagePath = keyof typeof rbacConfig.pages;

export async function checkPageAccess(path: string): Promise<boolean> {
  const session = await auth();
  const userRole = (session?.user as any)?.role as Role;

  if (!userRole) return false;
  if (userRole === "ADMIN") return true;

  const allowedRoles = rbacConfig.pages[path as PagePath];

  // Strict Security Policy: If page is not in config, DENY access.
  if (!allowedRoles) return false;

  return allowedRoles.includes(userRole);
}

export async function getCurrentRole(): Promise<Role | null> {
  const session = await auth();
  return (session?.user as any)?.role as Role | null;
}
