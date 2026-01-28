import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { Event } from "@/types";
import DashboardClient from "./_components/dashboard-client";
import { checkPageAccess } from "@/lib/rbac-server";
import { redirect } from "next/navigation";
import { getMisriDate } from "@/lib/misri-calendar";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const hasAccess = await checkPageAccess("/");
    if (!hasAccess) redirect("/login");

    const params = await searchParams;

    // Determine the target date (IST-aware logic)
    // If param exists, use it. Otherwise use current server time (adjusted to IST)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;

    let targetDate: Date;

    if (params.date) {
        // If query param "YYYY-MM-DD" is provided, treat it as the target day (midnight)
        targetDate = new Date(params.date);
    } else {
        targetDate = now;
    }

    // 1. Get components in IST (or from the target date)
    // If targetDate comes from param, it is usually UTC midnight (e.g. 2026-01-30T00:00:00.000Z)
    // If targetDate is now, it is UTC time.

    let year, month, day;

    if (params.date) {
        // Use the explicit date components from the param
        const d = new Date(params.date);
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
    } else {
        // Use current IST time to determine "Today"
        const options: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", year: 'numeric', month: 'numeric', day: 'numeric' };
        const formatter = new Intl.DateTimeFormat([], options);
        const parts = formatter.formatToParts(now);
        year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
        month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
        day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    }

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
        // Create a date object pointing to Noon UTC on that specific day to ensure stability
        const istDateForCal = new Date(Date.UTC(year, month, day, 12, 0, 0));
        const hijriData = getMisriDate(istDateForCal);
        todayHijri = `${hijriData.formattedEn} / ${hijriData.formattedAr}`;
    } catch (e) {
        console.error("Failed to calc Hijri", e);
    }

    return <DashboardClient initialEvents={initialEvents} todayHijri={todayHijri} currentDate={targetDate} />;
}
