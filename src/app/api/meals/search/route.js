import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../auth";

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const q         = searchParams.get("q")?.trim() || "";
    const favorites = searchParams.get("favorites") === "true";

    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
        ...(favorites && { isFavorite: true }),
      },
      orderBy: { createdAt: "desc" },
    });

    // Ingredient substring filter (Prisma array hasSome only matches exact elements)
    const filtered = q
      ? meals.filter((meal) =>
          meal.title?.toLowerCase().includes(q.toLowerCase()) ||
          meal.description?.toLowerCase().includes(q.toLowerCase()) ||
          meal.ingredients?.some((ing) =>
            ing.toLowerCase().includes(q.toLowerCase())
          )
        )
      : meals;

    return Response.json({ meals: filtered, total: filtered.length }, { status: 200 });
  } catch (error) {
    console.error("GET /api/meals/search failed:", error);
    return Response.json(
      { error: error.message || "Failed to search meals" },
      { status: 500 }
    );
  }
}