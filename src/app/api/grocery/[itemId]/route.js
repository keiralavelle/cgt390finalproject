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