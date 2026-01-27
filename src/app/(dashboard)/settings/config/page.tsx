import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import ConfigPageClient from "./client";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
    const hasAccess = await checkPageAccess("/settings/config");
    if (!hasAccess) console.log("No Access to Config Page"); // Debug
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return <ConfigPageClient />;
}
