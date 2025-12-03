import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { ProfileCheck } from "@/components/profile-check";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full relative">
            <ProfileCheck />
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-white border-r border-slate-200 print:hidden">
                <Sidebar />
            </div>
            <main className="md:pl-72 pb-10 print:pl-0">
                <div className="flex items-center p-4 md:hidden print:hidden">
                    <MobileSidebar />
                </div>
                {children}
            </main>
        </div>
    );
}
