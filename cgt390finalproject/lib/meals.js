import { prisma } from "./prisma";

/**
 * Create a new meal for a user
 */
export async function createMeal(userId, data) {
  return prisma.meal.create({
    data: {
      userId,
      title: data.title?.trim() || "",
      description: data.description?.trim() || "",
      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients.map((item) => item.trim()).filter(Boolean)
        : [],
      instructions: Array.isArray(data.instructions)
        ? data.instructions.map((item) => item.trim()).filter(Boolean)
        : [],
      isFavorite: Boolean(data.isFavorite),
    },
  });
}

/**
 * Get all meals for a user
 */
export async function getUserMeals(userId) {
  return prisma.meal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get one meal by id, but only if it belongs to the user
 */
export async function getMealById(userId, mealId) {
  return prisma.meal.findFirst({
    where: {
      id: mealId,
      userId,
    },
  });
}

/**
 * Update a meal
 */
export async function updateMeal(userId, mealId, data) {
  const existingMeal = await prisma.meal.findFirst({
    where: {
      id: mealId,
      userId,
    },
  });

  if (!existingMeal) {
    throw new Error("Meal not found");
  }

  return prisma.meal.update({
    where: { id: mealId },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && {
        description: data.description.trim(),
      }),
      ...(data.ingredients !== undefined && {
        ingredients: Array.isArray(data.ingredients)
          ? data.ingredients.map((item) => item.trim()).filter(Boolean)
          : [],
      }),
      ...(data.instructions !== undefined && {
        instructions: Array.isArray(data.instructions)
          ? data.instructions.map((item) => item.trim()).filter(Boolean)
          : [],
      }),
      ...(data.isFavorite !== undefined && {
        isFavorite: Boolean(data.isFavorite),
      }),
    },
  });
}

/**
 * Delete a meal
 */
export async function deleteMeal(userId, mealId) {
  const existingMeal = await prisma.meal.findFirst({
    where: {
      id: mealId,
      userId,
    },
  });

  if (!existingMeal) {
    throw new Error("Meal not found");
  }

  return prisma.meal.delete({
    where: { id: mealId },
  });
}

/**
 * Favorite or unfavorite a meal
 */
export async function toggleFavoriteMeal(userId, mealId, isFavorite) {
  const existingMeal = await prisma.meal.findFirst({
    where: {
      id: mealId,
      userId,
    },
  });

  if (!existingMeal) {
    throw new Error("Meal not found");
  }

  return prisma.meal.update({
    where: { id: mealId },
    data: {
      isFavorite: Boolean(isFavorite),
    },
  });
}

/**
 * Get favorite meals only
 */
export async function getFavoriteMeals(userId) {
  return prisma.meal.findMany({
    where: {
      userId,
      isFavorite: true,
    },
    orderBy: { title: "asc" },
  });
}

/**
 * Assign a saved meal to a calendar slot
 * weekStart should be a Date object for the Monday of that week
 * day should match the WeekDay enum, ex: "MONDAY"
 * slot should match the MealSlot enum, ex: "BREAKFAST"
 */
export async function assignMealToCalendar(userId, mealId, weekStart, day, slot) {
  const existingMeal = await prisma.meal.findFirst({
    where: {
      id: mealId,
      userId,
    },
  });

  if (!existingMeal) {
    throw new Error("Meal not found");
  }

  return prisma.calendarMeal.upsert({
    where: {
      userId_weekStart_day_slot: {
        userId,
        weekStart,
        day,
        slot,
      },
    },
    update: {
      mealId,
    },
    create: {
      userId,
      mealId,
      weekStart,
      day,
      slot,
    },
  });
}

/**
 * Get all calendar meal assignments for a given week
 */
export async function getWeekCalendar(userId, weekStart) {
  return prisma.calendarMeal.findMany({
    where: {
      userId,
      weekStart,
    },
    include: {
      meal: true,
    },
    orderBy: [
      { day: "asc" },
      { slot: "asc" },
    ],
  });
}

/**
 * Get one specific calendar slot
 */
export async function getCalendarSlot(userId, weekStart, day, slot) {
  return prisma.calendarMeal.findFirst({
    where: {
      userId,
      weekStart,
      day,
      slot,
    },
    include: {
      meal: true,
    },
  });
}

/**
 * Clear a meal from a specific calendar slot
 */
export async function clearCalendarSlot(userId, weekStart, day, slot) {
  const existingSlot = await prisma.calendarMeal.findFirst({
    where: {
      userId,
      weekStart,
      day,
      slot,
    },
  });

  if (!existingSlot) {
    return null;
  }

  return prisma.calendarMeal.delete({
    where: {
      id: existingSlot.id,
    },
  });
}

/**
 * Replace the entire week calendar in one transaction
 * entries = [{ day, slot, mealId }]
 */
export async function replaceWeekCalendar(userId, weekStart, entries) {
  return prisma.$transaction(async (tx) => {
    await tx.calendarMeal.deleteMany({
      where: {
        userId,
        weekStart,
      },
    });

    if (!Array.isArray(entries) || entries.length === 0) {
      return [];
    }

    const validMealIds = entries
      .map((entry) => entry.mealId)
      .filter(Boolean);

    const userMeals = await tx.meal.findMany({
      where: {
        userId,
        id: { in: validMealIds },
      },
      select: { id: true },
    });

    const allowedMealIds = new Set(userMeals.map((meal) => meal.id));

    const filteredEntries = entries.filter((entry) => allowedMealIds.has(entry.mealId));

    if (filteredEntries.length === 0) {
      return [];
    }

    for (const entry of filteredEntries) {
      await tx.calendarMeal.create({
        data: {
          userId,
          weekStart,
          day: entry.day,
          slot: entry.slot,
          mealId: entry.mealId,
        },
      });
    }

    return tx.calendarMeal.findMany({
      where: {
        userId,
        weekStart,
      },
      include: {
        meal: true,
      },
      orderBy: [
        { day: "asc" },
        { slot: "asc" },
      ],
    });
  });
}