// src/app/api/grocery/cost/route.js
//
// Estimates the cost of the user's current grocery list using
// Purdue RCAC GenAI Studio (OpenAI-compatible endpoint).
// Returns per-item estimates plus a total. Estimates only — never stored.

import { prisma } from "../../../../../lib/prisma";
import { auth } from "../../../../auth";

const RCAC_API_URL = "https://genai.rcac.purdue.edu/api/chat/completions";
const RCAC_MODEL   = "llama3.1:latest";

// Tolerant JSON extractor: strips markdown fences and finds the first {...} block.
function extractJson(rawText) {
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  // Try direct parse first
  try { return JSON.parse(cleaned); } catch {}
  // Fall back to first {...} block
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

    const itemLines = items
      .map((i) => `- ${i.name}${i.quantity ? ` (${i.quantity})` : ""}`)
      .join("\n");

    const prompt = `You are a US supermarket pricing expert. Estimate the cost of each item below at a typical mid-range US grocery store (e.g. Kroger, Meijer). Assume reasonable single-meal or weekly portions when no quantity is given.

ITEMS:
${itemLines}

Rules:
- Prices in USD
- Use realistic 2025 US grocery prices
- Return ONLY valid JSON, no explanation, no markdown, no extra text

Required JSON shape:
{
  "items": [
    { "name": "<exact item name from input>", "estimatedCost": <number, USD, 2 decimals> }
  ],
  "total": <number, sum of all items, 2 decimals>,
  "note": "<one short disclaimer about prices being estimates>"
}

Include every input item exactly once. Numeric values must be numbers, not strings.`;

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
      console.error("RCAC API error (cost):", errText);
      return Response.json({ error: `Pricing service returned ${rcacRes.status}` }, { status: 502 });
    }

    const data = await rcacRes.json();
    const rawText = data?.choices?.[0]?.message?.content || "";

    const parsed = extractJson(rawText);
    if (!parsed) {
      console.error("Failed to parse cost response:", rawText);
      return Response.json(
        { error: "AI returned an unparseable response. Try again." },
        { status: 502 }
      );
    }

    // Defensive: recompute total from items in case the LLM's arithmetic is off
    if (Array.isArray(parsed.items)) {
      const sum = parsed.items.reduce((acc, it) => acc + (Number(it.estimatedCost) || 0), 0);
      parsed.total = Math.round(sum * 100) / 100;
    }

    return Response.json(parsed, { status: 200 });
  } catch (error) {
    console.error("POST /api/grocery/cost failed:", error);
    return Response.json(
      { error: error.message || "Failed to estimate cost" },
      { status: 500 }
    );
  }
}