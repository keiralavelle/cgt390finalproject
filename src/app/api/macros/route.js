// src/app/api/macros/route.js
//
// Calls Purdue RCAC GenAI Studio (OpenAI-compatible endpoint) to estimate
// macros for the week's planned meals.
// Set RCAC_API_KEY in your .env.local file.
// Get your key from: https://genai.rcac.purdue.edu → avatar → Settings

import { auth } from "../../../auth";

const RCAC_API_URL = "https://genai.rcac.purdue.edu/api/chat/completions";
const RCAC_MODEL = "llama3.1:latest"; // or whichever model you prefer

export async function POST(req) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKey = process.env.RCAC_API_KEY;
        console.log("RCAC key present:", !!apiKey, "length:", apiKey?.length);
        console.log("key:", apiKey?.slice(0, 4), "...", apiKey?.slice(-4), "len:", apiKey?.length);
        if (!apiKey) {
            return Response.json({ error: "RCAC_API_KEY not configured in environment" }, { status: 500 });
        }

        const { meals } = await req.json();

        if (!Array.isArray(meals) || meals.length === 0) {
            return Response.json({ error: "No meals provided" }, { status: 400 });
        }

        // Build a clear, structured prompt
        const mealLines = meals.map(m => {
            const ingList = m.ingredients?.length
                ? m.ingredients.join(", ")
                : "no ingredients listed";
            return `- ${m.day} ${m.type}: "${m.title}" (ingredients: ${ingList})`;
        }).join("\n");

        const prompt = `You are a nutrition expert. Estimate the macros for each day and the full week based on these planned meals.

MEALS:
${mealLines}

Rules:
- Estimate reasonable serving sizes for a single adult meal
- Base estimates on typical recipes/portions for these meal names and ingredients
- Return ONLY valid JSON, no explanation, no markdown, no extra text

Required JSON shape:
{
  "week": {
    "calories": <number>,
    "protein": <number in grams>,
    "carbs": <number in grams>,
    "fat": <number in grams>,
    "fiber": <number in grams>,
    "note": "<one short disclaimer sentence>"
  },
  "days": {
    "Monday":    { "calories": <n>, "protein": <n>, "carbs": <n>, "fat": <n>, "fiber": <n> },
    "Tuesday":   { "calories": <n>, "protein": <n>, "carbs": <n>, "fat": <n>, "fiber": <n> },
    "Wednesday": { "calories": <n>, "protein": <n>, "carbs": <n>, "fat": <n>, "fiber": <n> },
    "Thursday":  { "calories": <n>, "protein": <n>, "carbs": <n>, "fat": <n>, "fiber": <n> },
    "Friday":    { "calories": <n>, "protein": <n>, "carbs": <n>, "fat": <n>, "fiber": <n> },
    "Saturday":  { "calories": <n>, "protein": <n>, "carbs": <n>, "fat": <n>, "fiber": <n> },
    "Sunday":    { "calories": <n>, "protein": <n>, "carbs": <n>, "fat": <n>, "fiber": <n> }
  }
}

Only include days that have meals planned. All numeric values must be integers.`;

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
                temperature: 0.2, // low temp for consistent structured output
            }),
        });

        if (!rcacRes.ok) {
            const errText = await rcacRes.text();
            console.error("RCAC API error:", errText);
            return Response.json(
                { error: `RCAC API returned ${rcacRes.status}` },
                { status: 502 }
            );
        }

        const rcacData = await rcacRes.json();
        const rawText = rcacData?.choices?.[0]?.message?.content || "";

        // Strip any accidental markdown fences before parsing
        const cleaned = rawText
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        let macros;
        try {
            macros = JSON.parse(cleaned);
        } catch {
            console.error("Failed to parse RCAC response as JSON:", rawText);
            return Response.json(
                { error: "AI returned an unparseable response. Try again." },
                { status: 502 }
            );
        }

        return Response.json(macros, { status: 200 });

    } catch (error) {
        console.error("POST /api/macros failed:", error);
        return Response.json(
            { error: error.message || "Failed to estimate macros" },
            { status: 500 }
        );
    }
}