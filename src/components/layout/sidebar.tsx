"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    CalendarPlus,
    Package,
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    User as UserIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/",
        color: "text-sky-500",
    },
    {
        label: "All Events",
        icon: CalendarPlus, // Or Calendar
        href: "/events",
        color: "text-violet-500",
    },
    {
        label: "New Event",
        icon: CalendarPlus,
        href: "/events/new",
        color: "text-violet-500",
    },
    {
        label: "Inventory",
        icon: Package,
        href: "/inventory",
        color: "text-pink-700",
    },
    {
        label: "Users",
        icon: Settings, // Or Users icon
        href: "/settings/users",
        color: "text-cyan-500",
    },
    {
        label: "Ledger",
        icon: ClipboardList,
        href: "/ledger",
        color: "text-emerald-500",
    },
    {
        label: "System Logs",
        icon: ClipboardList,
        href: "/logs",
        color: "text-orange-700",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/settings",
        color: "text-gray-500",
    },
    {
        label: "My Profile",
        icon: UserIcon,
        href: "/profile",
        color: "text-indigo-500",
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-white border-r border-slate-200 text-slate-900">
            <div className="px-3 py-2 flex-1">
                <Link href="/" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md">
                            J
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Jamaat Inv
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-slate-100 rounded-lg transition duration-200",
                                pathname === route.href ? "bg-amber-50 text-amber-700" : "text-slate-600"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3 transition-colors", pathname === route.href ? "text-amber-600" : "text-slate-400 group-hover:text-slate-600")} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    onClick={async () => {
                        try {
                            await fetch("/api/auth/logout", { method: "POST" });
                            window.location.href = "/login";
                        } catch (error) {
                            console.error("Logout failed:", error);
                        }
                    }}
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                </Button>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-white border-r border-slate-200 w-72">
                <Sidebar />
            </SheetContent>
        </Sheet>
    )
}
