-- CreateEnum
CREATE TYPE "MealSlot" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CalendarMeal" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "day" "WeekDay" NOT NULL,
    "slot" "MealSlot" NOT NULL,
    "userId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarMeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarMeal_userId_weekStart_idx" ON "CalendarMeal"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "CalendarMeal_mealId_idx" ON "CalendarMeal"("mealId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarMeal_userId_weekStart_day_slot_key" ON "CalendarMeal"("userId", "weekStart", "day", "slot");

-- CreateIndex
CREATE INDEX "GroceryItem_userId_idx" ON "GroceryItem"("userId");

-- CreateIndex
CREATE INDEX "Meal_userId_idx" ON "Meal"("userId");

-- CreateIndex
CREATE INDEX "Meal_userId_isFavorite_idx" ON "Meal"("userId", "isFavorite");

-- AddForeignKey
ALTER TABLE "CalendarMeal" ADD CONSTRAINT "CalendarMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarMeal" ADD CONSTRAINT "CalendarMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
