import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../auth";

export async function GET(req) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get("weekStart");

    if (!weekStart) {
      return Response.json({ error: "Missing weekStart" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const rows = await prisma.calendarMeal.findMany({
      where: {
        userId: user.id,
        weekStart: new Date(weekStart),
      },
      include: {
        meal: true,
      },
      orderBy: [
        { day: "asc" },
        { slot: "asc" },
      ],
    });

    return Response.json(rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/calendar failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load calendar" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { mealId, weekStart, day, slot } = body;

    if (!mealId || !weekStart || !day || !slot) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const meal = await prisma.meal.findFirst({
      where: {
        id: mealId,
        userId: user.id,
      },
    });

    if (!meal) {
      return Response.json({ error: "Meal not found" }, { status: 404 });
    }

    await prisma.calendarMeal.deleteMany({
      where: {
        userId: user.id,
        weekStart: new Date(weekStart),
        day,
        slot,
      },
    });

    const entry = await prisma.calendarMeal.create({
      data: {
        userId: user.id,
        mealId: meal.id,
        weekStart: new Date(weekStart),
        day,
        slot,
      },
      include: {
        meal: true,
      },
    });

    return Response.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/calendar failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save meal" },
      { status: 500 }
    );
  }
}