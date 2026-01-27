
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { checkPageAccess } from "@/lib/rbac-server";
import { InventoryItem } from "@/generated/prisma/client";
import EditInventoryClient from "./client";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditInventoryPage({ params }: PageProps) {
    const { id } = await params;

    // Strict RBAC Check
    // Reuse "/inventory/add" or rely on "/inventory" + Role check?
    // Let's check generally if they can access inventory management features
    const hasAccess = await checkPageAccess("/inventory/add");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    const item = await prisma.inventoryItem.findUnique({
        where: { id },
    });

    if (!item) {
        notFound();
    }

    // Ensure type safety across boundary
    const safeItem = {
        ...item,
        // serialize dates if any (inventoryItem has none usually, created/updatedAt yes)
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
    } as unknown as InventoryItem;

    return <EditInventoryClient initialItem={safeItem} />;
}
