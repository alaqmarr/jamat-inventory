
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Loader2, Clock, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConfigClientProps {
    initialBookingWindow: number;
}

export default function ConfigClient({ initialBookingWindow }: ConfigClientProps) {
    const router = useRouter();
    const [bookingWindow, setBookingWindow] = useState<number>(initialBookingWindow);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveConfig = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingWindow: Number(bookingWindow) }),
            });
            if (res.ok) {
                toast.success("Configuration saved");
                router.refresh();
            } else {
                throw new Error("Failed");
            }
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto p-8 md:p-12 max-w-6xl space-y-10">
            <PageHeader
                title="General Configuration"
                description="Manage global system rules and preferences."
                backUrl="/settings"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-0 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <CardHeader className="p-6 md:p-8">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-indigo-600" />
                                Booking Constraints
                            </CardTitle>
                            <CardDescription>Define how and when events can be booked.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="bookingWindow" className="text-sm font-semibold text-slate-900">
                                        Conflict Detection Window
                                    </label>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        This setting determines the buffer time (in minutes) around an event.
                                        The system uses this to prevent double-bookings or scheduling conflicts.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border shadow-sm">
                                        <span className="font-bold text-slate-700">{bookingWindow}</span>
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            id="bookingWindow"
                                            type="number"
                                            value={bookingWindow}
                                            onChange={(e) => setBookingWindow(Number(e.target.value))}
                                            className="h-10 bg-white border-slate-300"
                                            min={0}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-slate-600">Minutes</span>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    id="btn-config-save" // RBAC ID
                                    onClick={handleSaveConfig}
                                    disabled={isSaving}
                                    className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Side Panel for Info */}
                <div className="space-y-4">
                    <Card className="border-0 shadow-sm bg-slate-50/50">
                        <CardHeader className="p-6">
                            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">System Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                                <span className="text-sm text-slate-500">Version</span>
                                <span className="text-sm font-mono font-medium text-slate-900">v2.4.0-stable</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                                <span className="text-sm text-slate-500">Environment</span>
                                <span className="text-sm font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Production</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                                <span className="text-sm text-slate-500">Last Synced</span>
                                <span className="text-sm font-medium text-slate-900">Just now</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                            <strong className="block mb-1 text-indigo-900">Note:</strong>
                            Changing booking constraints affects all future booking attempts. Existing bookings remain unchanged.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
