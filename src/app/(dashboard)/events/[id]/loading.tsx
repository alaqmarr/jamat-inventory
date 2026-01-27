import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function EventLoading() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
            {/* Page Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" /> {/* Title */}
                        <div className="flex gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Stepper Skeleton */}
            <Skeleton className="h-32 w-full rounded-xl" />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="md:col-span-8 space-y-8">
                    {/* Event Meta Card Skeleton */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="pb-4 px-6 pt-6">
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-8 px-6 pb-8">
                            <div className="flex gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-6 w-32" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-6 w-32" />
                                </div>
                            </div>
                            <div className="sm:col-span-2 flex gap-4 border-t pt-6">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-6 w-48" />
                                    </div>
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Table Skeleton */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="px-6 pt-6 pb-4 md:px-8">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-64 mt-2" />
                        </CardHeader>
                        <CardContent className="px-6 pb-8 md:px-8">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Separator />
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex justify-between items-center py-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-5 w-12" />
                                        <Skeleton className="h-5 w-12" />
                                        <Skeleton className="h-5 w-12" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="md:col-span-4 space-y-6">
                    <Card className="shadow-md border-0 ring-1 ring-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b px-6 py-4">
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-8">
                            <div className="flex justify-between items-baseline">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-16" />
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-8 w-12" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-8 w-12" />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <Skeleton className="h-3 w-24" />
                                <div className="flex flex-wrap gap-2">
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                    <Skeleton className="h-6 w-32 rounded-full" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
