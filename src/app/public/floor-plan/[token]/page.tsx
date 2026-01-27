import { prisma } from "@/lib/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicFloorPlanViewer from "./client";

interface Props {
    params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { token } = await params;
    const plan = await prisma.floorPlan.findUnique({
        where: { publicToken: token },
    });

    return {
        title: plan ? `${plan.name} - Floor Plan` : "Floor Plan Not Found",
    };
}

export default async function PublicFloorPlanPage({ params }: Props) {
    const { token } = await params;
    const plan = await prisma.floorPlan.findUnique({
        where: { publicToken: token },
    });

    if (!plan) {
        return notFound();
    }

    return <PublicFloorPlanViewer plan={plan} />;
}
