import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import EventsClient from "./_components/events-client";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
    const hasAccess = await checkPageAccess("/events");
    if (!hasAccess) {
        redirect("/");
    }

    return <EventsClient />;
}
