"use client";

import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import { Role } from "@/types";

interface ProtectProps {
    children: ReactNode;
    role?: Role | Role[];
    fallback?: ReactNode;
}

export function Protect({ children, role, fallback = null }: ProtectProps) {
    const { data: session, status } = useSession();
    const userRole = (session?.user as any)?.role as Role;

    if (status === "loading") return null;

    if (!session || !userRole) return <>{fallback}</>;

    // Admin has access to everything
    if (userRole === "ADMIN") return <>{children}</>;

    if (role) {
        const allowedRoles = Array.isArray(role) ? role : [role];
        if (!allowedRoles.includes(userRole)) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}

export function useRole() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role as Role;

    return {
        role,
        isAdmin: role === "ADMIN",
        isManager: role === "MANAGER",
        isStaff: role === "STAFF",
        isWatcher: role === "WATCHER",
        canEdit: ["ADMIN", "MANAGER", "STAFF"].includes(role),
        canDelete: ["ADMIN", "MANAGER"].includes(role),
        canManageInventory: ["ADMIN", "MANAGER", "STAFF"].includes(role),
    };
}
