// src/app/api/account/preferences/route.js
//
// Read or update user preferences.
// Currently exposes: weekStartDay (MONDAY | SUNDAY)

import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../auth";

const ALLOWED_WEEK_START = new Set(["MONDAY", "SUNDAY"]);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { weekStartDay: true },
    });

    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json(
      { weekStartDay: user.weekStartDay || "MONDAY" },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/account/preferences failed:", error);
    return Response.json({ error: error.message || "Failed to load preferences" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = {};

    if ("weekStartDay" in body) {
      const v = String(body.weekStartDay).toUpperCase();
      if (!ALLOWED_WEEK_START.has(v)) {
        return Response.json(
          { error: "weekStartDay must be MONDAY or SUNDAY" },
          { status: 400 }
        );
      }
      data.weekStartDay = v;
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data,
      select: { weekStartDay: true },
    });

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/account/preferences failed:", error);
    return Response.json(
      { error: error.message || "Failed to update preferences" },
      { status: 500 }
    );
  }
}