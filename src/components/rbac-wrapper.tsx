"use client";

import React from "react";
import { useRBAC } from "@/hooks/use-rbac";

interface RBACWrapperProps {
    componentId: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RBACWrapper({ componentId, children, fallback = null }: RBACWrapperProps) {
    const { canViewComponent, isLoading } = useRBAC();

    if (isLoading) {
        // Optional: Render skeleton or nothing while loading permissions
        return null;
    }

    if (canViewComponent(componentId)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
