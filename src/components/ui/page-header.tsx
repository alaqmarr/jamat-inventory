"use client";

import { ReactNode } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    mobileActions?: { label: string; onClick: () => void; variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" }[];
}

export function PageHeader({ title, description, actions, mobileActions }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 pb-6 pt-2 md:flex-row md:items-center md:justify-between border-b mb-6">
            <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
                {actions}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
                {actions && <div className="flex gap-2">{actions}</div>}

                {mobileActions && mobileActions.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-5 w-5" />
                                <span className="sr-only">More actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {mobileActions.map((action, index) => (
                                <DropdownMenuItem key={index} onClick={action.onClick} className={action.variant === "destructive" ? "text-red-600" : ""}>
                                    {action.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
