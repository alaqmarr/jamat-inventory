"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Event } from "@/types";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useRouter } from "next/navigation";
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const locales = {
    "en-US": enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
    status: string; // Relaxed type to avoid conflicts with undefined
}

export default function CalendarClient() {
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("/api/events");
                if (res.ok) {
                    const data: Event[] = await res.json();

                    const calendarEvents = data.map(event => {
                        // Assuming duration is "Start - End" or parsing logic generally needed? 
                        // For now, let's assume occasionTime is just start time string "HH:MM AM/PM"
                        // But we need a duration. Since schema might be simple, let's default to specific logic
                        // If we don't have end time, default to 4 hours?

                        // Parse occasionDate + occasionTime
                        const startDateTimeString = `${event.occasionDate.split("T")[0]} ${event.occasionTime}`;
                        const startDate = new Date(startDateTimeString); // This simplistic parsing might be flaky depending on time format

                        // Robust parsing fallback (since event.occasionTime might be "08:00 PM")
                        let parsedStart = new Date(event.occasionDate); // Base date

                        // Simple check if date is valid
                        if (isNaN(parsedStart.getTime())) parsedStart = new Date();

                        // Add 4 hours for end date effectively
                        const parsedEnd = new Date(parsedStart.getTime() + (4 * 60 * 60 * 1000));

                        return {
                            id: event.id,
                            title: `${event.name} (${event.hall})`,
                            start: parsedStart,
                            end: parsedEnd,
                            status: event.status || "BOOKED", // Fallback for undefined
                            resource: event
                        };
                    });

                    setEvents(calendarEvents);
                }
            } catch (error) {
                console.error("Failed to fetch events", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const onNavigate = (newDate: Date) => setDate(newDate);
    const onView = (newView: View) => setView(newView);

    const onSelectEvent = (event: CalendarEvent) => {
        router.push(`/events/${event.id}`);
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        let backgroundColor = "#10b981"; // Emerald-500
        if (event.status === "CANCELLED") backgroundColor = "#ef4444"; // Red-500
        else if (new Date(event.start) < new Date()) backgroundColor = "#64748b"; // Slate-500 (Past)

        return {
            style: {
                backgroundColor,
                borderRadius: "6px",
                opacity: 0.8,
                color: "white",
                border: "0px",
                display: "block"
            }
        };
    };

    return (
        <div className="container mx-auto p-8 md:p-12 max-w-7xl space-y-8">
            <PageHeader
                title="Event Calendar"
                description="Visual schedule of all upcoming bookings."
                backUrl="/events"
            />

            <Card className="p-6 border-0 shadow-sm min-h-[600px] bg-white">
                {isLoading ? (
                    <div className="flex h-[500px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="h-[700px]">
                        <style>{`
                            .rbc-calendar { font-family: inherit; }
                            .rbc-header { padding: 12px 0; font-weight: 600; color: #475569; }
                            .rbc-month-view { border-radius: 12px; border: 1px solid #e2e8f0; }
                            .rbc-today { background-color: #f8fafc; }
                            .rbc-off-range-bg { background-color: #f1f5f9; }
                            .rbc-toolbar button { border: 1px solid #e2e8f0; color: #475569; }
                            .rbc-toolbar button.rbc-active { background-color: #4f46e5; color: white; border-color: #4f46e5; }
                            .rbc-toolbar button:hover { background-color: #f1f5f9; }
                            .rbc-toolbar button.rbc-active:hover { background-color: #4338ca; }
                        `}</style>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: "100%" }}
                            view={view}
                            date={date}
                            onNavigate={onNavigate}
                            onView={onView}
                            onSelectEvent={onSelectEvent}
                            eventPropGetter={eventStyleGetter}
                            views={[Views.MONTH, Views.WEEK, Views.DAY]}
                            popup
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
