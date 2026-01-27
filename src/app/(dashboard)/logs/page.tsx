import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import { LogsClient } from "./_components/logs-client";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
    const hasAccess = await checkPageAccess("/logs");
    if (!hasAccess) {
        redirect("/");
    }

    return <LogsClient />;
}
