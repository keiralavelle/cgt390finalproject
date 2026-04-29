// src/app/api/grocery/quantities/route.js
//
// Suggests realistic grocery quantities based on the items the user has on
// their list AND (optionally) the meals planned for the current week.
// Does NOT save the quantities — returns them for the user to review/accept.

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

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.RCAC_API_KEY;
    if (!apiKey) return Response.json({ error: "RCAC_API_KEY not configured" }, { status: 500 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const weekStart = body.weekStart; // optional — provides meal context

    const items = await prisma.groceryItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    if (items.length === 0) {
      return Response.json({ error: "Your grocery list is empty." }, { status: 400 });
    }

    // If a weekStart was passed, fetch that week's planned meals for context
    let mealContext = "";
    if (weekStart) {
      const calendarRows = await prisma.calendarMeal.findMany({
        where: { userId: user.id, weekStart: new Date(weekStart) },
        include: { meal: true },
      });
      const realMeals = calendarRows
        .filter(r => r.meal?.title && r.meal.title !== "__NO_MEAL__")
        .map(r => `- ${r.meal.title} (${r.meal.ingredients?.join(", ") || "no ingredients listed"})`);
      if (realMeals.length > 0) {
        mealContext = `\n\nPLANNED MEALS THIS WEEK (use these to estimate how much of each item is needed):\n${realMeals.join("\n")}`;
      }
    }

    const itemList = items.map(i =>
      `- ${i.name}${i.quantity ? ` (currently: ${i.quantity})` : ""}`
    ).join("\n");

    const prompt = `You are a meal planning assistant. The user has a grocery list and needs realistic quantity suggestions for one week of meals for ONE adult.

GROCERY LIST:
${itemList}${mealContext}

Rules:
- Suggest quantities that make sense for ONE adult eating these items over ONE week
- Use practical units a US shopper would recognize: lb, oz, quart, gallon, dozen, count, bunch, head, clove, cup, can
- Keep each quantity short — e.g. "1 lb", "2 dozen", "1 gallon", "3 cloves"
- If the user already has a quantity listed, suggest an updated one only if the existing value is clearly wrong; otherwise return their current quantity unchanged
- Return ONLY valid JSON, no explanation, no markdown, no extra text or comments

Required JSON shape:
{
  "quantities": [
    { "name": "<exact item name from input>", "quantity": "<short quantity string>" }
  ]
}

Include every input item exactly once, in the same order.`;

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
        temperature: 0.2,
      }),
    });

    if (!rcacRes.ok) {
      const errText = await rcacRes.text();
      console.error("RCAC API error (quantities):", errText);
      return Response.json({ error: `Quantity service returned ${rcacRes.status}` }, { status: 502 });
    }

    const data    = await rcacRes.json();
    const rawText = data?.choices?.[0]?.message?.content || "";
    const parsed  = extractJson(rawText);

    if (!parsed?.quantities || !Array.isArray(parsed.quantities)) {
      console.error("Failed to parse quantities response:", rawText);
      return Response.json({ error: "AI returned an unparseable response. Try again." }, { status: 502 });
    }

    // Sanitize and only include items that exist in the user's actual list
    const validNames = new Set(items.map(i => i.name.toLowerCase()));
    const clean = parsed.quantities
      .filter(q => q?.name && q?.quantity)
      .filter(q => validNames.has(String(q.name).toLowerCase()))
      .map(q => ({
        name:     String(q.name),
        quantity: String(q.quantity).trim(),
      }));

    return Response.json({ quantities: clean }, { status: 200 });
  } catch (error) {
    console.error("POST /api/grocery/quantities failed:", error);
    return Response.json({ error: error.message || "Failed to suggest quantities" }, { status: 500 });
  }
}