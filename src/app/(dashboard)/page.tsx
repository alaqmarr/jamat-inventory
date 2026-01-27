import { prisma } from "@/lib/db";
import { Event } from "@/types";
import DashboardClient from "./_components/dashboard-client";
import { checkPageAccess } from "@/lib/rbac-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const hasAccess = await checkPageAccess("/");
    if (!hasAccess) redirect("/login");

    // Fetch today's events server-side
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    let initialEvents: Event[] = [];
    try {
        const events = await prisma.event.findMany({
            where: {
                occasionDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            orderBy: {
                occasionDate: "asc"
            }
        });

        // Transform for client (dates to string if needed, or keeping Date objects if type allows)
        // The Event type likely expects strings or Date objects. 
        // Prisma returns Date objects. Firestore returns Timestamps.
        // Let's assume DashboardClient handles it or we map it.
        // Looking at previous file, it just spread doc.data().

        // We'll map to simple objects to be safe and match potential serializable requirements
        initialEvents = events.map(e => ({
            ...e,
            occasionDate: e.occasionDate.toISOString(), // Client likely expects string or handles it
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
            // Ensure compatibility with whatever Event type expects
            // If Event type has specific fields, we might need to cast
        })) as unknown as Event[];

    } catch (error) {
        console.error("Failed to fetch initial events:", error);
    }

    return <DashboardClient initialEvents={initialEvents} />;
}
