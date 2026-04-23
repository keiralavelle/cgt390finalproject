// src/app/api/calendar/remove/route.js
import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../auth";

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { weekStart, day, slot } = await req.json();

    if (!weekStart || !day || !slot) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.calendarMeal.findFirst({
      where: {
        userId: user.id,
        weekStart: new Date(weekStart),
        day,
        slot,
      },
    });

    if (!existing) {
      // Already gone — treat as success
      return Response.json({ success: true }, { status: 200 });
    }

    await prisma.calendarMeal.delete({ where: { id: existing.id } });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/calendar/remove failed:", error);
    return Response.json(
      { error: error.message || "Failed to remove meal" },
      { status: 500 }
    );
  }
}