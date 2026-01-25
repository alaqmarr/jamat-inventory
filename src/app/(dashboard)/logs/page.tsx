
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Log {
    id: string;
    action: string;
    details: any;
    userId: string;
    userName: string;
    timestamp: string;
}

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("/api/logs");
                const data = await res.json();
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch logs", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const getActionBadge = (action: string) => {
        if (action.includes("ERROR") || action.includes("FAIL")) return <Badge variant="destructive">{action}</Badge>;
        if (action.includes("CREATE")) return <Badge className="bg-emerald-600 hover:bg-emerald-700">{action}</Badge>;
        if (action.includes("UPDATE")) return <Badge className="bg-amber-600 hover:bg-amber-700">{action}</Badge>;
        if (action.includes("DELETE")) return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">{action}</Badge>;
        return <Badge variant="outline" className="bg-slate-100">{action}</Badge>;
    };

    const renderDetails = (details: any) => {
        if (!details) return <span className="text-slate-400">-</span>;

        // Inventory actions
        if (details.itemName && details.quantity) {
            return <span>{details.quantity} x <strong>{details.itemName}</strong></span>;
        }

        // Event actions
        if (details.eventName) {
            return <span>Event: <strong>{details.eventName}</strong></span>;
        }

        // Generic field updates
        if (details.field && (details.oldValue || details.newValue)) {
            return (
                <span className="text-xs">
                    Changed <strong>{details.field}</strong> from <span className="line-through text-slate-400">{details.oldValue}</span> to <strong>{details.newValue}</strong>
                </span>
            );
        }

        // Fallback for complex objects but cleaner
        return <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600">{JSON.stringify(details).substring(0, 50)}{JSON.stringify(details).length > 50 ? "..." : ""}</code>;
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Logs</h1>
                    <p className="text-slate-500">Real-time activity log of the system.</p>
                </div>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5 text-amber-600" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Timestamp</TableHead>
                                <TableHead className="w-[150px]">User</TableHead>
                                <TableHead className="w-[150px]">Action</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-slate-500 text-sm">
                                            {format(new Date(log.timestamp), "PP p")}
                                        </TableCell>
                                        <TableCell className="font-medium">{log.userName}</TableCell>
                                        <TableCell>
                                            {getActionBadge(log.action)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {renderDetails(log.details)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
