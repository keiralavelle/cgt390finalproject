// src/app/api/meals/[mealId]/favorite/route.js
import { prisma } from "../../../../../../lib/prisma";
import { auth } from "../../../../../auth";

export async function PATCH(req, { params }) {
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

    const { mealId } = await params;
    const body = await req.json();

    // Verify the meal belongs to this user before updating
    const meal = await prisma.meal.findFirst({
      where: { id: mealId, userId: user.id },
    });

    if (!meal) {
      return Response.json({ error: "Meal not found" }, { status: 404 });
    }

    const updated = await prisma.meal.update({
      where: { id: mealId },
      data: { isFavorite: Boolean(body.isFavorite) },
    });

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/meals/[mealId]/favorite failed:", error);
    return Response.json(
      { error: error.message || "Failed to update favorite" },
      { status: 500 }
    );
  }
}