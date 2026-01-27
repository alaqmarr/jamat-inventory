
import { Metadata } from "next";
import CalendarClient from "./client";

export const metadata: Metadata = {
    title: "Event Calendar | Jamaat Inventory",
    description: "Visual calendar view of events",
};

export default function CalendarPage() {
    return <CalendarClient />;
}
