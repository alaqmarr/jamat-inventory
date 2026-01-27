"use client";

import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Settings,
    Users,
    Menu,
    Building2,
    ChefHat,
    FileDown,
    RefreshCw,
    Calendar,
    PlusCircle,
    Package,
    ClipboardList,
    ScrollText,
    HelpCircle,
    LogOut,
    Grid,
    AlertTriangle
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/use-role";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

// Route groups for visual hierarchy
const routeGroups = [
    {
        label: "Main",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, href: "/" },
            { label: "New Event", icon: PlusCircle, href: "/events/new" },
        ]
    },
    {
        label: "Operations",
        items: [
            { label: "Events", icon: Calendar, href: "/events" },
            { label: "Floor Plan", icon: Grid, href: "/events/floor-plan" },
            { label: "Inventory", icon: Package, href: "/inventory" },
            { label: "Ledger", icon: ClipboardList, href: "/ledger" },
            { label: "Lost Items", icon: HelpCircle, href: "/lost-items" },
        ]
    },
    {
        label: "Management",
        items: [
            { label: "Users", icon: Users, href: "/settings/users" },
            { label: "Venues", icon: Building2, href: "/settings/venues" },
            { label: "Caterers", icon: ChefHat, href: "/settings/caterers" },
        ]
    },
    {
        label: "System",
        items: [
            { label: "Logs", icon: ScrollText, href: "/logs" },
            { label: "Sync", icon: RefreshCw, href: "/settings/data/sync" },
            { label: "Export", icon: FileDown, href: "/settings/data/export" },
            { label: "Settings", icon: Settings, href: "/settings/config" },
            { label: "System Reset", icon: AlertTriangle, href: "/settings/data" },
        ]
    }
];

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const { role, isLoading, user } = useRole();
    const [isOpen, setIsOpen] = useState(false);

    if (isLoading) return null;

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
            {/* Logo */}
            <div className="p-5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-lg">J</span>
                    </div>
                    <div>
                        <h1 className="font-semibold text-white text-base leading-tight">Jamaat Inventory</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">v2.0</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
                {routeGroups.map((group) => (
                    <div key={group.label}>
                        <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
                            {group.label}
                        </h4>
                        <div className="space-y-0.5">
                            {group.items.map((route) => {
                                const isActive = pathname === route.href;
                                return (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                                            isActive
                                                ? "bg-sidebar-accent text-white"
                                                : "text-slate-400 hover:bg-sidebar-accent/50 hover:text-slate-200"
                                        )}
                                    >
                                        {isActive && (
                                            <span className="w-0.5 h-4 bg-emerald-500 rounded-full -ml-1.5 mr-1" />
                                        )}
                                        <route.icon className={cn(
                                            "h-4 w-4",
                                            isActive ? "text-emerald-400" : "text-slate-500"
                                        )} />
                                        <span>{route.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-sidebar-border">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-slate-700">
                        <AvatarImage src={user?.image || ""} />
                        <AvatarFallback className="bg-slate-700 text-slate-300 text-xs font-medium">
                            {user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{user?.name || "User"}</p>
                        <p className="text-[10px] text-slate-500 capitalize">{role?.toLowerCase()}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Sheet */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <button className="lg:hidden fixed left-4 top-4 z-50 p-2.5 rounded-lg bg-slate-900 text-white shadow-lg border border-slate-800">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[260px] bg-sidebar border-sidebar-border">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <div className={cn("hidden lg:flex flex-col w-[260px] fixed inset-y-0 z-50 border-r border-sidebar-border", className)}>
                <SidebarContent />
            </div>
        </>
    );
}
