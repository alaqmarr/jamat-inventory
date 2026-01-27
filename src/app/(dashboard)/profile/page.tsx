import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileClient from "./_components/profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const userId = (session.user as any).id;
    let userData = {
        id: userId,
        name: session.user.name || "",
        email: session.user.email || "",
        mobile: (session.user as any).mobile || "",
        username: (session.user as any).username || "",
        role: (session.user as any).role || "Member",
    };

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user) {
            userData = {
                id: user.id,
                name: user.name || "",
                email: user.email || "",
                mobile: user.mobile || "",
                username: user.username,
                role: user.role,
            };
        }
    } catch (error) {
        console.error("Failed to fetch user data:", error);
    }

    return <ProfileClient initialUser={userData} />;
}
