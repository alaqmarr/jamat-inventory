import { Metadata } from "next";
import FloorPlanClient from "./client";
import { getHalls, getFloorItemTypes, getSavedPlans } from "./actions";

export const metadata: Metadata = {
    title: "Floor Plan Designer | Jamaat Inventory",
    description: "Interactive floor planner for events",
};

export default async function FloorPlanPage() {
    const [halls, itemTypes, savedPlans] = await Promise.all([
        getHalls(),
        getFloorItemTypes(),
        getSavedPlans()
    ]);

    return (
        <FloorPlanClient
            initialHalls={halls}
            initialItemTypes={itemTypes}
            initialSavedPlans={savedPlans}
        />
    );
}
