import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import CompleteProfileClient from "./client";

export const dynamic = "force-dynamic";

export default async function CompleteProfilePage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    return <CompleteProfileClient />;
}
