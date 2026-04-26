// src/app/api/meals/suggest/route.js
//
// Suggests meals the user could make based on their current grocery list.
// Uses Purdue RCAC GenAI Studio (OpenAI-compatible endpoint).
// Returns suggestions only — does NOT save them. The frontend lets the user
// pick which to save via the existing POST /api/meals.

import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../auth";

const RCAC_API_URL = "https://genai.rcac.purdue.edu/api/chat/completions";
const RCAC_MODEL   = "llama3.1:latest";

function extractJson(rawText) {
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.RCAC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "RCAC_API_KEY not configured" }, { status: 500 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const items = await prisma.groceryItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    if (items.length === 0) {
      return Response.json({ error: "Your grocery list is empty." }, { status: 400 });
    }

    const itemList = items.map((i) => i.name).join(", ");

    const prompt = `You are a home cook. Suggest 4 meals the user could realistically make given the ingredients on their grocery list. You may assume they also have common pantry staples (salt, pepper, oil, butter, basic spices, flour, sugar) but should mostly use items from the list.

GROCERY LIST: ${itemList}

Rules:
- Each meal should use multiple items from the list
- Be realistic — don't suggest dishes the list clearly can't support
- Keep instructions practical, 4–7 steps
- Return ONLY valid JSON, no explanation, no markdown, no extra text

Required JSON shape:
{
  "suggestions": [
    {
      "title": "<meal name>",
      "description": "<one short sentence>",
      "ingredients": ["<ingredient 1>", "<ingredient 2>", "..."],
      "instructions": ["<step 1>", "<step 2>", "..."],
      "usesFromList": ["<item from list>", "<item from list>"]
    }
  ]
}

Provide exactly 4 suggestions.`;

    const rcacRes = await fetch(RCAC_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: RCAC_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        temperature: 0.7, // higher temp for variety in suggestions
      }),
    });

    if (!rcacRes.ok) {
      const errText = await rcacRes.text();
      console.error("RCAC API error (suggest):", errText);
      return Response.json({ error: `Suggestion service returned ${rcacRes.status}` }, { status: 502 });
    }

    const data = await rcacRes.json();
    const rawText = data?.choices?.[0]?.message?.content || "";

    const parsed = extractJson(rawText);
    if (!parsed?.suggestions || !Array.isArray(parsed.suggestions)) {
      console.error("Failed to parse suggestions:", rawText);
      return Response.json(
        { error: "AI returned an unparseable response. Try again." },
        { status: 502 }
      );
    }

    // Sanitize each suggestion to match the Meal shape
    const clean = parsed.suggestions
      .filter((s) => s?.title && Array.isArray(s.ingredients))
      .map((s) => ({
        title:        String(s.title).trim(),
        description:  String(s.description || "").trim(),
        ingredients:  Array.isArray(s.ingredients)  ? s.ingredients.map(String).filter(Boolean)  : [],
        instructions: Array.isArray(s.instructions) ? s.instructions.map(String).filter(Boolean) : [],
        usesFromList: Array.isArray(s.usesFromList) ? s.usesFromList.map(String).filter(Boolean) : [],
      }));

    return Response.json({ suggestions: clean }, { status: 200 });
  } catch (error) {
    console.error("POST /api/meals/suggest failed:", error);
    return Response.json(
      { error: error.message || "Failed to suggest meals" },
      { status: 500 }
    );
  }
}