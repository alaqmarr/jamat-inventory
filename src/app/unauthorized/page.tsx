import Link from "next/link";
import { ShieldAlert, CheckCircle2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types";

export default async function UnauthorizedPage() {
    const session = await auth();
    const user = session?.user;
    const role = (user as any)?.role as Role;

    // Fetch user's assigned modules
    const userModules = await prisma.userModuleAccess.findMany({
        where: { userId: user?.id },
        select: { moduleId: true }
    });

    const moduleList = userModules.map(m => m.moduleId);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 px-4">
            <div className="flex flex-col items-center space-y-6 text-center max-w-md w-full">
                <div className="rounded-full bg-red-100 p-4 shadow-sm">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter text-slate-900">
                        Access Denied
                    </h1>
                    <p className="text-slate-500">
                        Your account <strong>{user?.name || user?.email}</strong> ({role}) does not have permission to access the application module.
                    </p>
                </div>

                {/* Module Status Card */}
                <div className="w-full bg-white rounded-lg border border-slate-200 p-6 shadow-sm text-left">
                    <h3 className="font-semibold text-slate-900 mb-4 border-b pb-2">Your Assigned Modules</h3>

                    {role === 'ADMIN' ? (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-md">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Admin Access (All Modules)</span>
                        </div>
                    ) : moduleList.length > 0 ? (
                        <ul className="space-y-2">
                            {moduleList.map((mod) => (
                                <li key={mod} className="flex items-center gap-2 text-slate-700">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="font-mono text-sm">{mod}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-slate-400 italic text-sm text-center py-2">
                            No modules assigned yet.
                        </div>
                    )}
                </div>

                <div className="flex gap-4 w-full justify-center">
                    <form action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/login" });
                    }}>
                        <Button variant="outline" className="gap-2">
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </form>

                    {!moduleList.includes("inventory-module") && (
                        <Button asChild>
                            <Link href="/">Try Again</Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
