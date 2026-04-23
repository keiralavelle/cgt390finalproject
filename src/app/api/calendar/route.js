// src/app/api/calendar/route.js
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../auth";

// Sentinel title used to mark "no meal planned" slots.
// Never shown to the user — the frontend checks for this value.
const NO_MEAL_TITLE = "__NO_MEAL__";

/**
 * Get or create the per-user "no meal" sentinel meal.
 * This is a real Meal row so the CalendarMeal FK constraint is satisfied,
 * but it has a special title the frontend recognises as "skipped".
 */
async function getOrCreateNoMealSentinel(userId) {
  return prisma.meal.upsert({
    where: {
      // Use a compound unique on userId + title — requires @@unique([userId, title])
      // in your schema. If you don't have that, fall back to findFirst + create below.
      // See the comment at the bottom of this file.
      userId_title: { userId, title: NO_MEAL_TITLE },
    },
    update: {},   // already exists — nothing to change
    create: {
      userId,
      title:        NO_MEAL_TITLE,
      description:  "",
      ingredients:  [],
      instructions: [],
      isFavorite:   false,
    },
  });
}

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const weekStart = searchParams.get("weekStart");
    if (!weekStart) return Response.json({ error: "Missing weekStart" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const rows = await prisma.calendarMeal.findMany({
      where: { userId: user.id, weekStart: new Date(weekStart) },
      include: { meal: true },
      orderBy: [{ day: "asc" }, { slot: "asc" }],
    });

    return Response.json(rows, { status: 200 });
  } catch (error) {
    console.error("GET /api/calendar failed:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Failed to load calendar" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { mealId, weekStart, day, slot } = body;

    if (!mealId || !weekStart || !day || !slot) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    let resolvedMealId;

    if (mealId === "NO_MEAL") {
      // Create/fetch the sentinel and use its real DB id
      const sentinel = await getOrCreateNoMealSentinel(user.id);
      resolvedMealId = sentinel.id;
    } else {
      const meal = await prisma.meal.findFirst({ where: { id: mealId, userId: user.id } });
      if (!meal) return Response.json({ error: "Meal not found" }, { status: 404 });
      resolvedMealId = meal.id;
    }

    // Upsert the calendar slot
    await prisma.calendarMeal.deleteMany({
      where: { userId: user.id, weekStart: new Date(weekStart), day, slot },
    });

    const entry = await prisma.calendarMeal.create({
      data: { userId: user.id, mealId: resolvedMealId, weekStart: new Date(weekStart), day, slot },
      include: { meal: true },
    });

    return Response.json(entry, { status: 201 });
  } catch (error) {
    console.error("POST /api/calendar failed:", error);
    return Response.json({ error: error instanceof Error ? error.message : "Failed to save meal" }, { status: 500 });
  }
}

/*
 * SCHEMA NOTE — add this to your Meal model in schema.prisma so the
 * upsert's where: { userId_title } compound key works:
 *
 *   @@unique([userId, title])
 *
 * Then run:  npx prisma migrate dev --name add_meal_unique_user_title
 *
 * If you'd rather not change the schema, replace getOrCreateNoMealSentinel with:
 *
 *   async function getOrCreateNoMealSentinel(userId) {
 *     const existing = await prisma.meal.findFirst({
 *       where: { userId, title: "__NO_MEAL__" },
 *     });
 *     if (existing) return existing;
 *     return prisma.meal.create({
 *       data: { userId, title: "__NO_MEAL__", description: "", ingredients: [], instructions: [], isFavorite: false },
 *     });
 *   }
 *
 * This version doesn't need a schema change but has a tiny race-condition
 * window on first use. In practice (single user) it's fine.
 */