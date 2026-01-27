import { prisma } from "@/lib/db";
import { InventoryItem } from "@/types";
import InventoryClient from "./_components/inventory-client";

import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    const hasAccess = await checkPageAccess("/inventory");
    if (!hasAccess) {
        redirect("/");
    }

    let initialItems: InventoryItem[] = [];

    try {
        const items = await prisma.inventoryItem.findMany({
            orderBy: { name: "asc" }
        });

        initialItems = items.map(item => ({
            ...item,
            // Ensure ID and other fields match expected type
        })) as unknown as InventoryItem[];

    } catch (error) {
        console.error("Failed to fetch inventory:", error);
    }

    return <InventoryClient initialItems={initialItems} />;
}
