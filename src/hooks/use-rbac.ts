"use client";

import { useRole } from "@/hooks/use-role";
import rbacConfig from "@/config/rbac.json";

type ComponentId = keyof typeof rbacConfig.components;
type PagePath = keyof typeof rbacConfig.pages;

export function useRBAC() {
  const { role, isLoading } = useRole();

  const canViewPage = (path: string): boolean => {
    if (isLoading || !role) return false;
    // Admin can practically do anything, but let's respect the config if listed
    if (role === "ADMIN") return true;

    // Exact match
    const pageRoles = rbacConfig.pages[path as PagePath];
    if (pageRoles) {
      return pageRoles.includes(role);
    }

    // Default: strict allows, or open?
    // Usually pages not listed are open to authenticated users unless blocked middleware.
    // For this hook, if not listed, return true (assuming middleware handles critical auth)
    return true;
  };

  const canViewComponent = (componentId: string): boolean => {
    if (isLoading || !role) return false;
    if (role === "ADMIN") return true;

    const allowedRoles = rbacConfig.components[componentId as ComponentId];
    if (!allowedRoles) {
      // Component not controlled by RBAC, visible to all
      return true;
    }
    return allowedRoles.includes(role);
  };

  return {
    canViewPage,
    canViewComponent,
    role,
    isLoading,
  };
}
