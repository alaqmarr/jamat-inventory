import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { checkPageAccess } from "@/lib/rbac-server";
import { CaterersClient } from "./_components/caterers-client";

export const dynamic = "force-dynamic";

export default async function CaterersPage() {
    const hasAccess = await checkPageAccess("/settings/data"); // Using same permission scope as Venues
    if (!hasAccess) {
        redirect("/");
    }

    let caterers: any[] = [];
    try {
        const items = await prisma.caterer.findMany({
            orderBy: { name: "asc" }
        });
        caterers = items;
    } catch (error) {
        console.error("Failed to fetch caterers:", error);
    }

    return <CaterersClient initialCaterers={caterers} />;
}
