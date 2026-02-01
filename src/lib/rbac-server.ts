import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import rbacConfig from "@/config/rbac.json";
import { Role } from "@/generated/prisma/client";

type PagePath = keyof typeof rbacConfig.pages;

export async function checkPageAccess(path: string): Promise<boolean> {
  const session = await auth();
  const userRole = (session?.user as any)?.role as Role;

  if (!userRole) return false;
  if (userRole === "ADMIN") return true;

  // Find matching rule
  let allowedRoles: Role[] | undefined;

  // 1. Exact match
  if (path in rbacConfig.pages) {
    allowedRoles = rbacConfig.pages[path as PagePath] as Role[];
  } else {
    // 2. Dynamic match (similar to middleware)
    const patterns = Object.keys(rbacConfig.pages).sort(
      (a, b) => b.length - a.length,
    );
    for (const pattern of patterns) {
      // Convert pattern like /events/[id] to regex
      const regexStr = pattern
        .replace(/\[\.\.\.[^\]]+\]/g, ".*")
        .replace(/\[[^\]]+\]/g, "[^/]+")
        .replace(/\//g, "\\/");

      if (new RegExp(`^${regexStr}$`).test(path)) {
        allowedRoles = rbacConfig.pages[pattern as PagePath] as Role[];
        break;
      }
    }
  }

  // Strict Security Policy: If page is not in config, DENY access.
  if (!allowedRoles) return false;

  return allowedRoles.includes(userRole);
}

export async function getCurrentRole(): Promise<Role | null> {
  const session = await auth();
  return (session?.user as any)?.role as Role | null;
}

/**
 * Check if user has access to a specific module.
 * ADMIN always bypasses this check.
 * For other roles, checks the UserModuleAccess table in the database.
 *
 * @param moduleId - The module ID to check (e.g., "inventory-module")
 * @returns true if user has access, false otherwise
 */
export async function checkModuleAccess(moduleId: string): Promise<boolean> {
  const session = await auth();
  const user = session?.user as any;
  const userRole = user?.role as Role;
  const userId = user?.id as string;

  if (!userRole || !userId) return false;

  // ADMIN bypasses all module checks
  if (userRole === "ADMIN") return true;

  // Query database for module access
  const access = await prisma.userModuleAccess.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId,
      },
    },
  });

  return !!access;
}

// Alias for backward compatibility
export const checkComponentAccess = checkModuleAccess;
