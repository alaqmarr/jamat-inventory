import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProfileCheck } from "@/components/profile-check";
import { auth } from "@/lib/auth";
import { Role } from "@/types";
export const preferredRegion = ["sin1"];
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    // Use role or default to something safe if undefined, though strict typing suggests it might be undefined
    // sidebar handles undefined role gracefully
    const role = (session?.user as any)?.role as Role | undefined;

    return (
        <div className="h-full relative min-h-screen bg-slate-50/50">
            <ProfileCheck />

            {/* Unified Sidebar handles both Mobile (Sheet) and Desktop (Fixed) */}
            <Sidebar className="print:hidden" />

            {/* Main Content - Padded to accomodate fixed sidebar on desktop */}
            <main className="lg:pl-[280px] h-full transition-all duration-300 flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
