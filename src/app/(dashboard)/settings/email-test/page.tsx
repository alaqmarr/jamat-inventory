import { checkPageAccess } from "@/lib/rbac-server";
import { redirect } from "next/navigation";
import EmailTestClient from "./client";

export default async function EmailTestPage() {
    const hasAccess = await checkPageAccess("/settings/email-test");

    return <EmailTestClient />;
}
