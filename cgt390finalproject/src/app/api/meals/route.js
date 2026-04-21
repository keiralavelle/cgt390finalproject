import {prisma }from "../../../../lib/prisma";
import { auth } from "../../../auth";

export async function GET() {
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

    const meals = await prisma.meal.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(meals, { status: 200 });
  } catch (error) {
    console.error("GET /api/meals failed:", error);
    return Response.json(
      { error: error.message || "Failed to load meals" },
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
    const { title, description, ingredients, instructions } = body;

    if (!title || !title.trim()) {
      return Response.json(
        { error: "Meal title is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const meal = await prisma.meal.create({
      data: {
        title: title.trim(),
        description: description || "",
        ingredients: ingredients || [],
        instructions: instructions || [],
        user: {
          connect: { id: user.id },
        },
      },
    });

    return Response.json(meal, { status: 201 });
  } catch (error) {
    console.error("POST /api/meals failed:", error);
    return Response.json(
      { error: error.message || "Failed to create meal" },
      { status: 500 }
    );
  }
}