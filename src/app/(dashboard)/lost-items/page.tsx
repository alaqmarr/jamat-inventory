import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import LostItemsClient from "./_components/lost-items-client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LostItemsPage() {
    const hasAccess = await checkPageAccess("/lost-items");
    if (!hasAccess) {
        redirect("/");
    }

    let initialLogs: any[] = [];
    try {
        // Fetch from EventInventory where lostQty > recoveredQty (database as source of truth)
        const lostAllocations = await prisma.eventInventory.findMany({
            where: {
                lostQty: { gt: 0 },
            },
            include: {
                item: { select: { id: true, name: true } },
                event: { select: { id: true, name: true } },
            },
        });

        // Filter to only include items with remaining lost quantity
        initialLogs = lostAllocations
            .filter(alloc => alloc.lostQty > alloc.recoveredQty)
            .map(alloc => ({
                id: alloc.id,
                eventId: alloc.eventId,
                eventName: alloc.event.name,
                itemId: alloc.itemId,
                action: "INVENTORY_LOSS",
                timestamp: Date.now(),
                userName: "System",
                // For compatibility with existing client component:
                details: {
                    itemId: alloc.itemId,
                    quantity: alloc.lostQty,
                    eventId: alloc.eventId,
                    itemName: alloc.item.name,
                },
                remainingQuantity: alloc.lostQty - alloc.recoveredQty,
            }));

        // Sort by remaining quantity desc (most urgent first)
        initialLogs.sort((a, b) => b.remainingQuantity - a.remainingQuantity);

    } catch (error) {
        console.error("Failed to fetch lost items server-side", error);
    }

    return <LostItemsClient initialLogs={initialLogs} />;
}
