"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Database, FileSpreadsheet, FileJson, Upload, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

export default function DataManagementPageClient() {
    const router = useRouter();
    const { isAdmin, isLoading: isRoleLoading } = useRole();
    const [activeTab, setActiveTab] = useState("export");

    // Data Management State
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (!isRoleLoading && !isAdmin) {
            toast.error("Unauthorized access");
            router.push("/");
        }
    }, [isAdmin, isRoleLoading, router]);

    if (isRoleLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
    if (!isAdmin) return null;

    const handleSync = async (direction: "firestore-to-neon" | "neon-to-firestore") => {
        setIsSyncing(true);
        try {
            const res = await fetch(`/api/admin/sync/${direction}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    collections: ["users", "events", "inventory", "settings"]
                }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`Sync successful: ${JSON.stringify(data.results)}`);
            } else {
                throw new Error(data.error || "Sync failed");
            }
        } catch (error) {
            toast.error("Sync operation failed");
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExport = (type: string, format: string) => {
        window.open(`/api/admin/export?type=${type}&format=${format}`, "_blank");
    };

    const handleRestore = async () => {
        if (!restoreFile) return;
        setIsRestoring(true);
        const formData = new FormData();
        formData.append("file", restoreFile);

        try {
            const res = await fetch("/api/admin/restore", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                toast.success("Data restored successfully");
                setRestoreFile(null);
                window.location.reload();
            } else {
                throw new Error("Restore failed");
            }
        } catch (error) {
            toast.error("Failed to restore data");
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="container mx-auto p-8 md:p-12 max-w-6xl space-y-10">
            <PageHeader
                title="Data Management"
                description="Export system data, restore from backups, or sync databases."
                backUrl="/settings"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-8">
                    <TabsTrigger value="export">Export Data</TabsTrigger>
                    <TabsTrigger value="restore">Restore Backup</TabsTrigger>
                    <TabsTrigger value="sync">Sync Data</TabsTrigger>
                    <TabsTrigger value="health">System Health</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                <TabsContent value="export" className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-blue-600" />
                                <CardTitle>Export Data</CardTitle>
                            </div>
                            <CardDescription>Download system data in Excel or JSON format.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { id: "master", label: "Full System Backup", desc: "All users, events, inventory, and logs." },
                                    { id: "users", label: "Users", desc: "Registered system users and roles." },
                                    { id: "events", label: "Events", desc: "All booked and past events." },
                                    { id: "inventory", label: "Inventory", desc: "Current stock items and levels." },
                                    { id: "logs", label: "System Logs", desc: "Audit trail of all actions." },
                                    { id: "ledger", label: "Ledger", desc: "Financial/Transaction records." },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div>
                                            <h4 className="font-medium text-slate-900">{item.label}</h4>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button id={`btn-data-export-${item.id}-excel`} variant="outline" size="sm" onClick={() => handleExport(item.id, "excel")} className="h-8">
                                                <FileSpreadsheet className="mr-2 h-3.5 w-3.5 text-green-600" /> Excel
                                            </Button>
                                            <Button id={`btn-data-export-${item.id}-json`} variant="outline" size="sm" onClick={() => handleExport(item.id, "json")} className="h-8">
                                                <FileJson className="mr-2 h-3.5 w-3.5 text-orange-600" /> JSON
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="restore">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Upload className="h-5 w-5 text-orange-600" />
                                <CardTitle>Restore Data</CardTitle>
                            </div>
                            <CardDescription>Restore data from a backup file. Existing data may be overwritten.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 items-end border p-4 rounded-lg bg-slate-50/50">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="restore-file">Select Backup File</Label>
                                    <Input id="restore-file" type="file" accept=".json,.xlsx,.xls" onChange={(e) => setRestoreFile(e.target.files?.[0] || null)} className="bg-white" />
                                </div>
                                <Drawer>
                                    <DrawerTrigger asChild>
                                        <Button id="btn-data-restore" disabled={!restoreFile || isRestoring} className="w-full sm:w-auto">
                                            {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            Restore Data
                                        </Button>
                                    </DrawerTrigger>
                                    <DrawerContent className="px-4 pb-8">
                                        <DrawerHeader className="text-center pt-6">
                                            <DrawerTitle className="text-xl font-bold">Confirm Restore</DrawerTitle>
                                            <DrawerDescription className="text-slate-500 mt-2">
                                                Are you sure you want to restore data from <strong className="text-slate-900">{restoreFile?.name}</strong>?
                                                <br /><br />
                                                This will merge/overwrite existing data. This action cannot be undone.
                                            </DrawerDescription>
                                        </DrawerHeader>
                                        <DrawerFooter className="flex flex-col gap-3 mt-4">
                                            <Button id="btn-data-restore-confirm" onClick={handleRestore} className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white">
                                                Yes, Restore
                                            </Button>
                                            <DrawerClose asChild>
                                                <Button variant="outline" className="w-full h-12 rounded-xl border-slate-300">
                                                    Cancel
                                                </Button>
                                            </DrawerClose>
                                        </DrawerFooter>
                                    </DrawerContent>
                                </Drawer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sync">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-indigo-600" />
                                <CardTitle>Database Synchronization</CardTitle>
                            </div>
                            <CardDescription>
                                Sync data between Firestore (Legacy) and Neon PostgreSQL (New).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SyncStatsPanel onSync={handleSync} isSyncing={isSyncing} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="health">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <CardTitle>System Health</CardTitle>
                            </div>
                            <CardDescription>Check database latency and connectivity.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <HealthCheckPanel />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="danger">
                    <Card className="border-red-200">
                        <CardHeader className="bg-red-50 border-b border-red-100">
                            <CardTitle className="text-red-700">Danger Zone</CardTitle>
                            <CardDescription className="text-red-600/80">Irreversible actions. Proceed with caution.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-slate-900">Reset System Data</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Delete all events, logs, and transactions. Reset inventory quantities.
                                        <br />
                                        <span className="font-bold text-slate-700">Master Data (Users, Items, Venues) will be preserved.</span>
                                    </p>
                                </div>
                                <ResetSystemButton />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}



function SyncStatsPanel({ onSync, isSyncing }: { onSync: (dir: "firestore-to-neon" | "neon-to-firestore") => void, isSyncing: boolean }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/sync/stats");
            if (res.ok) setStats(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [isSyncing]); // Refetch after sync

    if (loading && !stats) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" /></div>;

    const getDiffColor = (neon: number, fs: number) => {
        if (neon === fs) return "text-green-600 bg-green-50";
        return "text-amber-600 bg-amber-50";
    };

    const renderStatRow = (label: string, neonKey: string, fsKey: string) => {
        const neon = stats?.neon?.[neonKey] || 0;
        const fs = stats?.firestore?.[fsKey] || 0;
        const diff = Math.abs(neon - fs);

        return (
            <div className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <span className="text-slate-600">{label}</span>
                <div className="flex items-center gap-4">
                    <div className="text-center w-16">
                        <span className="text-xs text-slate-400 block">Neon</span>
                        <span className="font-mono font-medium">{neon}</span>
                    </div>
                    <div className="text-center w-16">
                        <span className="text-xs text-slate-400 block">Firestore</span>
                        <span className="font-mono font-medium">{fs}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold w-16 text-center ${diff === 0 ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"}`}>
                        {diff === 0 ? "Synced" : `${diff} diff`}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Firestore -> Neon */}
                <div className="border rounded-xl p-4 space-y-4 bg-slate-50/50 flex flex-col h-full">
                    <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            Firestore <ChevronRight className="h-4 w-4 text-slate-400" /> Neon PostgreSQL
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">
                            Pull data from Legacy Firestore to New System.
                        </p>
                        <div className="bg-white rounded-lg border p-3 mb-4 space-y-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Record Mismatches</h4>
                            {renderStatRow("Users", "users", "users")}
                            {renderStatRow("Events", "events", "events")}
                            {renderStatRow("Inventory", "inventory", "inventory")}
                            {renderStatRow("Halls", "halls", "halls")}
                            {renderStatRow("Caterers", "caterers", "caterers")}
                        </div>
                    </div>
                    <div className="mt-auto">
                        <Button
                            id="btn-data-sync-neon"
                            onClick={() => onSync("firestore-to-neon")}
                            disabled={isSyncing}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Sync to Neon
                        </Button>
                    </div>
                </div>

                {/* Neon -> Firestore */}
                <div className="border rounded-xl p-4 space-y-4 bg-slate-50/50 flex flex-col h-full">
                    <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            Neon PostgreSQL <ChevronRight className="h-4 w-4 text-slate-400" /> Firestore
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">
                            Push new data to Legacy System (Backup).
                        </p>
                        {/* Summary Block */}
                        <div className="bg-white rounded-lg border p-4 mb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-900">Total Records (Neon)</div>
                                    <div className="text-2xl font-bold font-mono">
                                        {(stats?.neon?.users || 0) + (stats?.neon?.events || 0) + (stats?.neon?.inventory || 0)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-slate-500">
                                This count will be pushed to Firestore, overwriting matching IDs.
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto">
                        <Button
                            id="btn-data-sync-firestore"
                            onClick={() => onSync("neon-to-firestore")}
                            disabled={isSyncing}
                            variant="outline"
                            className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Sync to Firestore
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ResetSystemButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleSendOtp = async () => {
        setLoadingOtp(true);
        try {
            const res = await fetch("/api/auth/otp/send", { method: "POST" });
            if (res.ok) {
                toast.success("OTP sent to your email");
                setOtpSent(true);
            } else {
                toast.error("Failed to send OTP");
            }
        } catch (error) {
            toast.error("Error sending OTP");
        } finally {
            setLoadingOtp(false);
        }
    };

    const handleReset = async () => {
        if (!otp || otp.length < 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setIsResetting(true);
        try {
            const res = await fetch("/api/system/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("System reset successfully");
                setIsOpen(false);
                window.location.reload();
            } else {
                toast.error(data.error || "Reset failed");
            }
        } catch (error) {
            toast.error("Failed to reset system");
        } finally {
            setIsResetting(false);
        }
    };

    const resetState = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setOtp("");
            setOtpSent(false);
        }
    };

    return (
        <Drawer open={isOpen} onOpenChange={resetState}>
            <DrawerTrigger asChild>
                <Button id="btn-data-reset" variant="destructive">Reset System</Button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-8 max-w-lg mx-auto">
                <DrawerHeader className="text-center pt-6">
                    <DrawerTitle className="text-xl font-bold text-red-600">Reset System Data</DrawerTitle>
                    <DrawerDescription className="text-slate-500 mt-2">
                        This action will delete all <strong className="text-red-600">Events</strong>, <strong className="text-red-600">Logs</strong>, and transactions.
                        <br />
                        <strong className="text-emerald-600">Master Data (Users, Inventory Items, Venues) will be preserved.</strong>
                    </DrawerDescription>
                </DrawerHeader>

                <div className="py-6 px-4 space-y-4">
                    {!otpSent ? (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-slate-600">
                                To proceed, we need to verify your identity. <br />
                                Please request an OTP to your registered email.
                            </p>
                            <Button
                                onClick={handleSendOtp}
                                disabled={loadingOtp}
                                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                            >
                                {loadingOtp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP Code"}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-otp">Enter OTP sent to your email</Label>
                                <Input
                                    id="reset-otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                    placeholder="• • • • • •"
                                    className="text-center text-2xl tracking-widest h-14 font-mono"
                                    autoFocus
                                />
                                <p className="text-xs text-center text-slate-400">
                                    Code expires in 10 minutes.
                                    <button onClick={handleSendOtp} className="text-blue-600 hover:underline ml-1">Resend?</button>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DrawerFooter className="flex flex-col gap-3">
                    {otpSent && (
                        <Button
                            id="btn-data-reset-confirm"
                            variant="destructive"
                            onClick={handleReset}
                            disabled={!otp || otp.length < 6 || isResetting}
                            className="w-full h-12 rounded-xl text-lg font-semibold"
                        >
                            {isResetting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirm System Reset"}
                        </Button>
                    )}
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-slate-300">
                            Cancel
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function HealthCheckPanel() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const start = performance.now();
            const res = await fetch("/api/health");
            const data = await res.json();
            const end = performance.now();

            setStatus({
                ...data,
                clientLatency: Math.round(end - start)
            });
            if (res.ok) toast.success("System is healthy");
            else toast.error("System health check failed");
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                <div>
                    <h3 className="font-medium text-slate-900">Connection Status</h3>
                    <p className="text-sm text-slate-500">
                        {status ? (status.status === "ok" ? "All Systems Operational" : "System Issues Detected") : "Unknown"}
                    </p>
                </div>
                <Button onClick={checkHealth} disabled={loading} variant="outline" className="border-green-200 hover:bg-green-50 text-green-700">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Ping Neon DB
                </Button>
            </div>

            {status && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Neon PostgreSQL</h4>
                        <div className="text-2xl font-mono font-bold text-slate-800">
                            {status.database?.latencyMs !== undefined ? `${status.database.latencyMs}ms` : "N/A"}
                        </div>
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                            {status.database?.status === "connected" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>}
                            {status.database?.status === "connected" ? "Connected" : <span className="text-red-500">Error</span>}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Firebase RTDB</h4>
                        <div className="text-2xl font-mono font-bold text-slate-800">
                            {status.rtdb?.latencyMs !== undefined ? `${status.rtdb.latencyMs}ms` : "N/A"}
                        </div>
                        <div className="text-xs text-green-600 mt-1 flex items-center">
                            {status.rtdb?.status === "connected" && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>}
                            {status.rtdb?.status === "connected" ? "Connected" : <span className="text-red-500">Error</span>}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Client Latency</h4>
                        <div className="text-2xl font-mono font-bold text-slate-800">
                            {status.clientLatency ? `${status.clientLatency}ms` : "N/A"}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Total Roundtrip</div>
                    </div>
                </div>
            )}
        </div>
    );
}


