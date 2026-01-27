import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import { LedgerClient } from "./_components/ledger-client";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
    const hasAccess = await checkPageAccess("/ledger");
    if (!hasAccess) {
        redirect("/");
    }

    return <LedgerClient />;
}
