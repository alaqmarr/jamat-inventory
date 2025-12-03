import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Settings",
    description: "System settings and configuration. Manage master data, users, and system preferences.",
};

export default function SettingsPage() {
    redirect("/settings/config");
}
