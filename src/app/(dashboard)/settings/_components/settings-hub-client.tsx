"use client";

import Link from "next/link";
import {
    Loader2,
    Building2,
    Utensils,
    Database,
    Settings,
    ChevronRight,
    RefreshCw,
    CheckCircle,
    XCircle,
    Zap,
    Server,
    Users,
    Shield,
    Activity,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface DbHealth {
    database: { status: "connected" | "error"; latencyMs: number; error?: string };
    rtdb: { status: "connected" | "error"; latencyMs: number; error?: string };
}

export function SettingsHubClient() {
    const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);

    const checkHealth = async () => {
        setIsCheckingHealth(true);
        try {
            const res = await fetch("/api/health");
            const data = await res.json();
            setDbHealth(data);
        } catch (error) {
            toast.error("Failed to check database connectivity");
        } finally {
            setIsCheckingHealth(false);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    const getLatencyColor = (ms: number) => {
        if (ms < 100) return "text-emerald-500";
        if (ms < 300) return "text-amber-500";
        return "text-red-500";
    };

    const cards = [
        {
            title: "General Configuration",
            desc: "Global booking rules, system preferences, and defaults.",
            icon: Settings,
            href: "/settings/config",
            color: "text-slate-600",
            bg: "bg-slate-50",
            ring: "group-hover:ring-slate-200"
        },
        {
            title: "Venues & Halls",
            desc: "Manage physical locations, capacities, and availability.",
            icon: Building2,
            href: "/settings/venues",
            color: "text-blue-600",
            bg: "bg-blue-50",
            ring: "group-hover:ring-blue-200"
        },
        {
            title: "Caterers Management",
            desc: "Approved food providers, menus, and contact details.",
            icon: Utensils,
            href: "/settings/caterers",
            color: "text-amber-600",
            bg: "bg-amber-50",
            ring: "group-hover:ring-amber-200"
        },
        {
            title: "Users & Roles",
            desc: "Control access through roles and permissions.",
            icon: Users,
            href: "/settings/users",
            color: "text-violet-600",
            bg: "bg-violet-50",
            ring: "group-hover:ring-violet-200"
        },
        {
            title: "Data & Backup",
            desc: "Export system data, restore backups, or perform resets.",
            icon: Database,
            href: "/settings/data",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            ring: "group-hover:ring-emerald-200"
        }
    ];

    return (
        <div className="container mx-auto p-6 md:p-10 max-w-7xl space-y-12">
            <PageHeader
                title="System Settings"
                description="Manage global configuration, master data, and system health."
            />

            {/* System Health Hero */}
            <div className="grid grid-cols-1 gap-6">
                <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <Activity className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">System Status</CardTitle>
                                    <CardDescription>Real-time infrastructure health check</CardDescription>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={checkHealth}
                                disabled={isCheckingHealth}
                                className="bg-white border-slate-200 text-slate-600 hover:text-indigo-600"
                            >
                                <RefreshCw className={cn("h-4 w-4 mr-2", isCheckingHealth && "animate-spin")} />
                                Refresh Status
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            {/* PostgreSQL Status */}
                            <div className="p-6 md:p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                                        dbHealth?.database?.status === "connected" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                    )}>
                                        <Database className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">Primary Database</p>
                                        <p className="text-sm text-slate-500">PostgreSQL (Neon)</p>
                                    </div>
                                </div>

                                {dbHealth ? (
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1.5 mb-1">
                                            <div className={cn("h-2 w-2 rounded-full", dbHealth.database.status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                            <span className="text-sm font-medium text-slate-700">
                                                {dbHealth.database.status === "connected" ? "Operational" : "Error"}
                                            </span>
                                        </div>
                                        {dbHealth.database.status === "connected" && (
                                            <p className={cn("text-xs font-mono font-medium", getLatencyColor(dbHealth.database.latencyMs))}>
                                                {dbHealth.database.latencyMs}ms latency
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
                                )}
                            </div>

                            {/* Firebase Status */}
                            <div className="p-6 md:p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                                        dbHealth?.rtdb?.status === "connected" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                                    )}>
                                        <Globe className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">Realtime Engine</p>
                                        <p className="text-sm text-slate-500">Firebase RTDB</p>
                                    </div>
                                </div>

                                {dbHealth ? (
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1.5 mb-1">
                                            <div className={cn("h-2 w-2 rounded-full", dbHealth.rtdb.status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                                            <span className="text-sm font-medium text-slate-700">
                                                {dbHealth.rtdb.status === "connected" ? "Operational" : "Error"}
                                            </span>
                                        </div>
                                        {dbHealth.rtdb.status === "connected" && (
                                            <p className={cn("text-xs font-mono font-medium", getLatencyColor(dbHealth.rtdb.latencyMs))}>
                                                {dbHealth.rtdb.latencyMs}ms latency
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Management Grid */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-bold">Administration Modules</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => (
                        <Link key={card.href} href={card.href} className="group block h-full outline-none">
                            <Card className={cn(
                                "h-full border-slate-200 shadow-sm transition-all duration-300 overflow-hidden",
                                "group-hover:shadow-md group-hover:-translate-y-1 group-focus:ring-2 ring-offset-2 ring-indigo-500",
                                card.ring
                            )}>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className={cn("p-3 rounded-xl transition-colors", card.bg)}>
                                            <card.icon className={cn("h-6 w-6", card.color)} />
                                        </div>
                                        <div className="bg-slate-50 text-slate-300 rounded-full p-1 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                            {card.title}
                                        </h4>
                                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                            {card.desc}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
