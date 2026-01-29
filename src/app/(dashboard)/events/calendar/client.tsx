"use client";

import { SharedCalendar } from "@/components/shared-calendar";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useRouter } from "next/navigation";

export default function CalendarClient() {
    const router = useRouter();

    const handleEventSelect = (eventId: string) => {
        router.push(`/events/${eventId}`);
    };

    return (
        <div className="container mx-auto p-8 md:p-12 max-w-7xl space-y-8">
            <PageHeader
                title="Event Calendar"
                description="Visual schedule of all upcoming bookings."
                backUrl="/events"
            />

            <Card className="p-6 border-0 shadow-sm min-h-[600px] bg-white">
                <SharedCalendar
                    onEventSelect={handleEventSelect}
                />
            </Card>
        </div>
    );
}
