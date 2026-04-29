// src/app/api/grocery/route.js
import { prisma } from "../../../../lib/prisma";
import { auth } from "../../../auth";

// Combine two free-text quantities. Both can be null/empty.
// We don't try to parse units — just concatenate distinct values
// so the user sees "1 lb + 2 lbs" and can clean it up if they want.
function mergeQuantities(existing, incoming) {
  const a = (existing || "").trim();
  const b = (incoming || "").trim();
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  if (a.toLowerCase() === b.toLowerCase()) return a;
  return `${a} + ${b}`;
}

// Find an existing item by case-insensitive name match.
// Returns the row or null.
async function findExistingByName(userId, name) {
  return prisma.groceryItem.findFirst({
    where: {
      userId,
      // Postgres case-insensitive match
      name: { equals: name.trim(), mode: "insensitive" },
    },
  });
}

// Add or merge a single item. Returns the resulting row.
async function addOrMerge(userId, name, quantity) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = await findExistingByName(userId, trimmed);
  if (existing) {
    const mergedQty = mergeQuantities(existing.quantity, quantity);
    return prisma.groceryItem.update({
      where: { id: existing.id },
      data: { quantity: mergedQty },
    });
  }
  return prisma.groceryItem.create({
    data: {
      name: trimmed,
      quantity: quantity?.trim() || null,
      userId,
    },
  });
}

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

    // Bulk: { items: [{ name, quantity? }, ...] }
    if (Array.isArray(body.items)) {
      // Process sequentially so two items with the same name in one batch
      // also merge correctly (parallel would race on the upsert).
      const results = [];
      for (const i of body.items) {
        if (!i?.name?.trim()) continue;
        const row = await addOrMerge(user.id, i.name, i.quantity);
        if (row) results.push(row);
      }
      return Response.json(results, { status: 201 });
    }

    // Single: { name, quantity? }
    if (!body.name?.trim()) {
      return Response.json({ error: "Item name is required" }, { status: 400 });
    }

    const item = await addOrMerge(user.id, body.name, body.quantity);
    return Response.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/grocery failed:", error);
    return Response.json({ error: error.message || "Failed to add item" }, { status: 500 });
  }
}