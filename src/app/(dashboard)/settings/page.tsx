import { redirect } from "next/navigation";
import { rtdb } from "@/lib/firebase";
import { checkPageAccess } from "@/lib/rbac-server";
import { SettingsHubClient } from "./_components/settings-hub-client";

export const dynamic = "force-dynamic";

export default async function SettingsHubPage() {
    const hasAccess = await checkPageAccess("/settings");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    let bookingWindow = 60;
    try {
        const snapshot = await rtdb.ref("config/bookingWindow").once("value");
        const val = snapshot.val();
        if (typeof val === "number") bookingWindow = val;
    } catch (error) {
        console.error("Failed to fetch booking config:", error);
    }

    return <SettingsHubClient initialBookingWindow={bookingWindow} />;
}
