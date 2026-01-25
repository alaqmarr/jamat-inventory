
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Utensils, Warehouse, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { Event } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
    const router = useRouter();
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Fetch events (no polling, stable key)
    const { data: events, isLoading } = useSWR<Event[]>(
        `/api/events?date=${date ? date.toISOString() : ''}`,
        fetcher
    );

    const totalThaal = events?.reduce((sum, event) => sum + (event.thaalCount || 0), 0) || 0;
    const hallsBooked = new Set(events?.map(e => e.hall)).size || 0;

    const handleShare = (eventId: string) => {
        const url = `${window.location.origin}/public/events/${eventId}`;
        navigator.clipboard.writeText(url);
        toast.success("Public link copied to clipboard!");
    };

    return (
        <div className="p-8 space-y-8 bg-slate-50/50 min-h-full">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-lg">Overview for {date ? format(date, "EEEE, MMMM do, yyyy") : "All Events"}</p>
                </div>
                <Button onClick={() => router.push("/events/new")} className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 text-lg rounded-xl">
                    <CalendarIcon className="mr-2 h-5 w-5" /> New Event
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content - Left Side */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Total Thaal</p>
                                    <h3 className="text-3xl font-bold text-slate-900">{isLoading ? "..." : totalThaal}</h3>
                                </div>
                                <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Utensils className="h-6 w-6 text-amber-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Halls Occupied</p>
                                    <h3 className="text-3xl font-bold text-slate-900">{isLoading ? "..." : hallsBooked}</h3>
                                </div>
                                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Warehouse className="h-6 w-6 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Events</p>
                                    <h3 className="text-3xl font-bold text-slate-900">{isLoading ? "..." : events?.length || 0}</h3>
                                </div>
                                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <CalendarIcon className="h-6 w-6 text-emerald-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Events List */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Schedule</h2>
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-900" onClick={() => router.push("/events")}>
                                View All &rarr;
                            </Button>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div></div>
                        ) : events?.length === 0 ? (
                            <Card className="bg-slate-50 border-dashed border-2 border-slate-200">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <CalendarIcon className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">No events found</h3>
                                    <p className="text-slate-500 max-w-sm mt-1">
                                        {date ? "There are no events scheduled for this date." : "No events found."} Click "New Event" to add one.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {events?.map((event) => (
                                    <Card key={event.id} className="group hover:shadow-md transition-all cursor-pointer border-l-4 border-l-amber-500" onClick={() => router.push(`/events/${event.id}`)}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center justify-center bg-amber-50 h-16 w-16 rounded-xl text-amber-700 font-bold border border-amber-100">
                                                        <span className="text-xs uppercase tracking-wider">{event.occasionDate ? format(new Date(event.occasionDate), "MMM") : "TBA"}</span>
                                                        <span className="text-2xl">{event.occasionDate ? format(new Date(event.occasionDate), "d") : "?"}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">{event.name}</h3>
                                                        <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-600 uppercase tracking-wide">
                                                                {Array.isArray(event.hall) ? event.hall.join(", ") : event.hall}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{event.occasionTime}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right hidden sm:block">
                                                        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-amber-100">
                                                            <Utensils className="h-3 w-3" />
                                                            {event.thaalCount} Thaal
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">{event.catererName}</div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleShare(event.id!); }}>
                                                            <Settings className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Calendar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle>Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex justify-center pb-6">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                className="rounded-md border-none"
                                classNames={{
                                    day_selected: "bg-amber-600 text-white hover:bg-amber-600 hover:text-white focus:bg-amber-600 focus:text-white",
                                    day_today: "bg-slate-100 text-slate-900",
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-white/10 rounded-full blur-2xl"></div>
                        <CardContent className="p-8 relative z-10">
                            <h3 className="font-bold text-xl mb-2">Quick Actions</h3>
                            <p className="text-indigo-100 text-sm mb-6">Manage your inventory and events efficiently.</p>

                            <div className="space-y-3">
                                <Button onClick={() => router.push("/inventory/add")} variant="secondary" className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-0">
                                    <Utensils className="mr-2 h-4 w-4" /> Add Inventory
                                </Button>
                                <Button onClick={() => router.push("/settings/config")} variant="secondary" className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-0">
                                    <Settings className="mr-2 h-4 w-4" /> Configure Halls
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
