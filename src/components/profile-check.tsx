"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function ProfileCheck() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === "loading") return;

        // console.log("ProfileCheck Session:", session); // Debugging

        if (session?.user) {
            const user = session.user as any;
            const hasCompletedOrSkipped = user.profileStatus === "COMPLETED" || user.profileStatus === "SKIPPED";
            const isCompleteProfilePage = pathname === "/complete-profile";

            // console.log("Profile Status:", user.profileStatus); // Debugging

            if (!hasCompletedOrSkipped && !isCompleteProfilePage) {
                // console.log("Redirecting to complete profile...");
                router.push("/complete-profile");
            }
        }
    }, [session, status, pathname, router]);

    return null;
}
