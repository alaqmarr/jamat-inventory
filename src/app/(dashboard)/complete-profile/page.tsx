import { redirect } from "next/navigation";
import { checkPageAccess } from "@/lib/rbac-server";
import CompleteProfileClient from "./client";

export const dynamic = "force-dynamic";

export default async function CompleteProfilePage() {
    const hasAccess = await checkPageAccess("/complete-profile");
    if (!hasAccess) {
        redirect("/login");
    }

    return <CompleteProfileClient />;
}
