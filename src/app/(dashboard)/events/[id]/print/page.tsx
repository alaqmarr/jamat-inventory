import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import EventPrintClient from "./client";

export const dynamic = "force-dynamic";

export default async function EventPrintPage() {
    // Print page access should match event view access generally, but maybe restricted?
    const hasAccess = await checkPageAccess("/events/[id]/print");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return <EventPrintClient />;
}
