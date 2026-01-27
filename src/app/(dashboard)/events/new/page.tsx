import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import NewEventClient from "./_components/new-event-client";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
    const hasAccess = await checkPageAccess("/events"); // New event creation is restricted to ADMIN/MANAGER ideally.
    // Using "/events" gives WATCHER access too which is WRONG for creating.
    // I need to use "/events/new" key if it exists, or add it.

    // existing rbac.json doesn't have events/new.
    // I should add it.

    const hasCreateAccess = await checkPageAccess("/events/new");
    if (!hasCreateAccess) {
        redirect("/unauthorized");
    }

    return <NewEventClient />;
}
