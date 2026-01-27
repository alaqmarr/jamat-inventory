import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import LostItemsClient from "./_components/lost-items-client";

export const dynamic = "force-dynamic";

export default async function LostItemsPage() {
    const hasAccess = await checkPageAccess("/lost-items");
    if (!hasAccess) {
        redirect("/");
    }
    return <LostItemsClient />;
}
