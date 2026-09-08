import { prisma } from "@/lib/db";
import { Event } from "@/types";
import DashboardClient from "./_components/dashboard-client";
import { checkPageAccess } from "@/lib/rbac-server";
import { redirect } from "next/navigation";
import { getMisriDate } from "@/lib/misri-calendar";
import { getISTDayBounds } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const hasAccess = await checkPageAccess("/");
    if (!hasAccess) redirect("/login");

    const params = await searchParams;

    const targetDateStr = params.date || new Date();
    const targetDate = typeof targetDateStr === "string" ? new Date(targetDateStr) : targetDateStr;

    const { startOfDay: startOfIstDay, endOfDay: endOfIstDay } = getISTDayBounds(targetDateStr);

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

        initialEvents = events.map(e => ({
            ...e,
            occasionDate: e.occasionDate.toISOString(),
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
        })) as unknown as Event[];

    } catch (error) {
        console.error("Failed to fetch initial events:", error);
    }

    // Fetch Hijri Date for the TARGET date
    let todayHijri = null;
    try {
        const hijriData = getMisriDate(targetDateStr);
        todayHijri = `${hijriData.formattedEn} / ${hijriData.formattedAr}`;
    } catch (e) {
        console.error("Failed to calc Hijri", e);
    }

    return <DashboardClient initialEvents={initialEvents} todayHijri={todayHijri} currentDate={targetDate} />;
}
