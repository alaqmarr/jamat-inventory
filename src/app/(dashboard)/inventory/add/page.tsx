import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import InventoryAddClient from "./client";

export const dynamic = "force-dynamic";

export default async function InventoryAddPage() {
    const hasAccess = await checkPageAccess("/inventory/add");
    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return <InventoryAddClient />;
}
