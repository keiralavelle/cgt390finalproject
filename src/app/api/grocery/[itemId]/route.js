// src/app/api/grocery/[itemId]/route.js
import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../auth";

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const { itemId } = await params;

    const item = await prisma.groceryItem.findFirst({
      where: { id: itemId, userId: user.id },
    });

    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

    await prisma.groceryItem.delete({ where: { id: itemId } });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/grocery/[itemId] failed:", error);
    return Response.json({ error: error.message || "Failed to delete" }, { status: 500 });
  }
}

// Edit the quantity (and optionally name) of an existing item.
// Body: { name?, quantity? }  — null for quantity clears it.
export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const { itemId } = await params;
    const body = await req.json();

    const item = await prisma.groceryItem.findFirst({
      where: { id: itemId, userId: user.id },
    });
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

    // Build the update payload — only include fields the caller actually sent.
    const data = {};
    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }
    if ("quantity" in body) {
      // Empty string or null both mean "clear"
      const q = typeof body.quantity === "string" ? body.quantity.trim() : "";
      data.quantity = q || null;
    }

    if (Object.keys(data).length === 0) {
      return Response.json(item, { status: 200 });
    }

    const updated = await prisma.groceryItem.update({
      where: { id: itemId },
      data,
    });

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/grocery/[itemId] failed:", error);
    return Response.json({ error: error.message || "Failed to update" }, { status: 500 });
  }
}