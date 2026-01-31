import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { checkPageAccess, getCurrentRole } from "@/lib/rbac-server";
import { Event, InventoryItem } from "@/types";
import EventDetailsClient from "./_components/event-details-client";
import { getMisriDate } from "@/lib/misri-calendar";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EventDetailsPage({ params }: PageProps) {
    const { id: eventId } = await params;

    // Strict Server-Side Check
    const hasAccess = await checkPageAccess("/events/[id]");
    if (!hasAccess) redirect("/unauthorized");

    try {
        // Fetch event, inventory, and event allocations from Prisma
        const [event, inventory, eventInventory] = await Promise.all([
            prisma.event.findUnique({ where: { id: eventId } }),
            prisma.inventoryItem.findMany(),
            prisma.eventInventory.findMany({
                where: { eventId },
                include: { item: { select: { name: true } } },
            }),
        ]);

        if (!event) {
            notFound();
        }

        // Transform for client to ensure serialization matches types
        const safeEvent = {
            ...event,
            occasionDate: event.occasionDate.toISOString(),
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
        } as unknown as Event;

        const safeInventory = inventory.map(i => ({
            ...i,
        })) as unknown as InventoryItem[];

        // Transform eventInventory for client (single source of truth)
        const safeAllocations = eventInventory.map(alloc => ({
            id: alloc.id,
            eventId: alloc.eventId,
            itemId: alloc.itemId,
            itemName: alloc.item.name,
            issuedQty: alloc.issuedQty,
            returnedQty: alloc.returnedQty,
            lostQty: alloc.lostQty,
            recoveredQty: alloc.recoveredQty,
        }));

        // Fetch Hijri Date (Server Side) Algorithmic
        let hijriString = null;
        try {
            const d = new Date(formatInTimeZone(safeEvent.occasionDate, 'Asia/Kolkata', 'yyyy-MM-dd'));
            const hijriData = getMisriDate(d);
            hijriString = `${hijriData.formattedEn} / ${hijriData.formattedAr}`;
        } catch (e) {
            console.error("Hijri calc failed", e);
        }

        return (
            <EventDetailsClient
                initialEvent={safeEvent}
                initialInventory={safeInventory}
                initialAllocations={safeAllocations}
                initialHijriDate={hijriString}
            />
        );
    } catch (error) {
        console.error("Failed to fetch event data:", error);
        notFound();
    }
}

