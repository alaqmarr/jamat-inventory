import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import EditEventClient from "./client";

export const dynamic = "force-dynamic";

export default async function EditEventPage() {
    const hasAccess = await checkPageAccess("/events/[id]"); // Edit page falls under event view/edit access generally, but edit specifically logic is in component. 
    // Wait, editing requires stricter access? 
    // rbac.json has "btn-event-edit": ["ADMIN", "MANAGER"]
    // But page view "/events/[id]" is ["ADMIN", "MANAGER", "WATCHER"]
    // There is no specific rbac entry for "/events/[id]/edit". 
    // Let's add strict check for ADMIN/MANAGER here manually or assume if they can't see the button they can't get here? No, URL access.
    // I should check role here.

    // Actually, let's use checkPageAccess but I need to ensure the key is in rbac.json or I handle it.
    // Ideally I should add "/events/[id]/edit" to rbac.json.
    // START_REVIEW: I will add "/events/[id]/edit" to rbac.json

    const hasEditAccess = await checkPageAccess("/events/[id]/edit");
    if (!hasEditAccess) {
        redirect("/unauthorized");
    }

    return <EditEventClient />;
}
