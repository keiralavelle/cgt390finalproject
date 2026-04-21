// src/app/api/meals/[mealId]/favorite/route.js
import { NextResponse } from "next/server";
import { toggleFavoriteMeal } from "../../../../../../lib/meals";

export async function PATCH(req, { params }) {
  const userId = "replace-with-real-auth-user-id";
  const body = await req.json();

  await toggleFavoriteMeal(userId, params.mealId, body.isFavorite);

  return NextResponse.json({ success: true });
}