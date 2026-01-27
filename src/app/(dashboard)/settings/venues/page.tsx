import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { checkPageAccess } from "@/lib/rbac-server";
import { VenuesClient } from "./_components/venues-client";

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
    const hasAccess = await checkPageAccess("/settings/data"); // Assuming strict admin access like Data page
    if (!hasAccess) {
        redirect("/");
    }

    let venues: any[] = [];
    try {
        const halls = await prisma.hall.findMany({
            orderBy: { name: "asc" }
        });
        venues = halls;
    } catch (error) {
        console.error("Failed to fetch venues:", error);
    }

    return <VenuesClient initialVenues={venues} />;
}
