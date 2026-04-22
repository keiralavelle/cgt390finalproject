// src/app/api/grocery/route.js
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const items = await prisma.groceryItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return Response.json(items, { status: 200 });
  } catch (error) {
    console.error("GET /api/grocery failed:", error);
    return Response.json({ error: error.message || "Failed to load" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();

    // Supports both a single item { name, quantity? }
    // and a bulk import { items: [{ name, quantity? }, ...] }
    if (Array.isArray(body.items)) {
      const created = await Promise.all(
        body.items
          .filter((i) => i.name?.trim())
          .map((i) =>
            prisma.groceryItem.create({
              data: { name: i.name.trim(), quantity: i.quantity?.trim() || null, userId: user.id },
            })
          )
      );
      return Response.json(created, { status: 201 });
    }

    if (!body.name?.trim()) {
      return Response.json({ error: "Item name is required" }, { status: 400 });
    }

    const item = await prisma.groceryItem.create({
      data: { name: body.name.trim(), quantity: body.quantity?.trim() || null, userId: user.id },
    });

    return Response.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/grocery failed:", error);
    return Response.json({ error: error.message || "Failed to add item" }, { status: 500 });
  }
}