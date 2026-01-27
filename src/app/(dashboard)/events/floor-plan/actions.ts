"use server";

import { prisma } from "@/lib/db";
import { getCurrentRole } from "@/lib/rbac-server";
import { revalidatePath } from "next/cache";

export async function getHalls() {
  return await prisma.hall.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getFloorItemTypes() {
  return await prisma.floorItemType.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getSavedPlans() {
  return await prisma.floorPlan.findMany({
    orderBy: { updatedAt: "desc" },
    include: { hall: true },
  });
}

export async function createFloorItemType(data: {
  name: string;
  type: string;
  width: number;
  length: number;
  color: string;
}) {
  const role = await getCurrentRole();
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Unauthorized");
  }

  try {
    const item = await prisma.floorItemType.create({ data });
    revalidatePath("/events/floor-plan");
    return { success: true, data: item };
  } catch (e) {
    console.error("Create Item Type Error", e);
    return { success: false, error: "Failed to create item type" };
  }
}

export async function saveFloorPlan(data: {
  id?: string;
  name: string;
  hallId: string;
  data: any;
  width: number;
  length: number;
  isPublic: boolean;
}) {
  const role = await getCurrentRole();
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Unauthorized");
  }

  try {
    let plan;
    if (data.id) {
      plan = await prisma.floorPlan.update({
        where: { id: data.id },
        data: {
          name: data.name,
          data: data.data,
          width: data.width,
          length: data.length,
          isPublic: data.isPublic,
        },
      });
    } else {
      plan = await prisma.floorPlan.create({
        data: {
          name: data.name,
          hallId: data.hallId,
          data: data.data,
          width: data.width,
          length: data.length,
          isPublic: data.isPublic,
        },
      });
    }
    revalidatePath("/events/floor-plan");
    return { success: true, data: plan };
  } catch (e) {
    console.error("Save Plan Error", e);
    return { success: false, error: "Failed to save plan" };
  }
}
