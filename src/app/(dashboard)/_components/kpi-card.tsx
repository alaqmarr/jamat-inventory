"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface KPICardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    loading?: boolean;
}

export function KPICard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    trendUp,
    loading = false
}: KPICardProps) {
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">
                        {loading ? (
                            <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" />
                        ) : (
                            value
                        )}
                    </h3>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            {(description || trend) && (
                <div className="mt-4 flex items-center gap-2 text-xs">
                    {trend && (
                        <span className={cn(
                            "font-medium px-2 py-0.5 rounded-full",
                            trendUp
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-slate-100 text-slate-600"
                        )}>
                            {trend}
                        </span>
                    )}
                    {description && (
                        <span className="text-muted-foreground">{description}</span>
                    )}
                </div>
            )}
        </Card>
    );
}
