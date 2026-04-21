import { prisma } from "./prisma";

export async function assignMealToCalendar(userId, mealId, weekStart, day, slot) {
  return prisma.calendarMeal.upsert({
    where: {
      userId_weekStart_day_slot: {
        userId,
        weekStart,
        day,
        slot,
      },
    },
    update: { mealId },
    create: {
      userId,
      mealId,
      weekStart,
      day,
      slot,
    },
  });
}

export async function getWeekCalendar(userId, weekStart) {
  return prisma.calendarMeal.findMany({
    where: {
      userId,
      weekStart,
    },
    include: {
      meal: true,
    },
  });
}