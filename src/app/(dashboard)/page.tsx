import { prisma } from "@/lib/db";
import { Event } from "@/types";
import DashboardClient from "./_components/dashboard-client";
import { checkPageAccess } from "@/lib/rbac-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const hasAccess = await checkPageAccess("/");
    if (!hasAccess) redirect("/login");

    // Fetch today's events server-side (IST-aware)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset); // Approximate shifted time for day extraction if server is UTC

    // Better approach: Create date based on IST string
    const istDateString = now.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" });
    const startOfDay = new Date(istDateString); // This gives 00:00:00 local time of the server if we just pass string? No.
    // If we pass "1/27/2026" to new Date(), it assumes local.
    // We want 00:00:00 IST.

    // Let's explicitly construct the range in UTC that corresponds to IST day.
    // Start of Day IST: 00:00:00 IST = Prev Day 18:30:00 UTC
    // End of Day IST: 23:59:59 IST = Today 18:29:59 UTC

    // 1. Get current time in IST
    const options: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", year: 'numeric', month: 'numeric', day: 'numeric' };
    const formatter = new Intl.DateTimeFormat([], options);
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // JS months are 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');

    // Create Start of Day in IST (local representation)
    // We need to query the database. Prisma stores dates in UTC usually.
    // We want events where occasionDate is between [Start of IST Day in UTC] and [End of IST Day in UTC].

    // Start of IST Day = YYYY-MM-DD 00:00:00 IST
    // UTC equivalent = YYYY-MM-DD 00:00:00 - 5h30m
    const startOfIstDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    startOfIstDay.setHours(startOfIstDay.getHours() - 5);
    startOfIstDay.setMinutes(startOfIstDay.getMinutes() - 30);

    const endOfIstDay = new Date(startOfIstDay);
    endOfIstDay.setHours(endOfIstDay.getHours() + 24);
    endOfIstDay.setMilliseconds(-1);

    let initialEvents: Event[] = [];
    try {
        const events = await prisma.event.findMany({
            where: {
                occasionDate: {
                    gte: startOfIstDay,
                    lte: endOfIstDay
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
