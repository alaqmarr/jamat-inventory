import { Suspense } from "react";
import ExportDataClient from "./client";
import { Loader2 } from "lucide-react";
import { checkPageAccess } from "@/lib/rbac-server";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Export Data | Jamaat Inventory",
    description: "Export event statistics and data",
};

export default async function ExportDataPage() {
    const hasAccess = await checkPageAccess("/export-data");
    if (!hasAccess) redirect("/unauthorized");

    return (
        <div className="w-full">
            <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>}>
                <ExportDataClient />
            </Suspense>
        </div>
    );
}
