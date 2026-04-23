/*
  Warnings:

  - A unique constraint covering the columns `[userId,title]` on the table `Meal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Meal_userId_title_key" ON "Meal"("userId", "title");
