// src/app/api/macros/route.js
//
// Calls Purdue RCAC GenAI Studio (OpenAI-compatible endpoint) to estimate
// macros for the week's planned meals.

import { auth } from "../../../auth";

const RCAC_API_URL = "https://genai.rcac.purdue.edu/api/chat/completions";
const RCAC_MODEL   = "llama3.1:latest";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function extractJson(rawText) {
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

// Compute the date for each day of the week given the Monday-anchored weekStart
function computeDayDates(weekStart) {
  if (!weekStart) return null;
  const ws = new Date(`${weekStart}T12:00:00`);
  if (isNaN(ws)) return null;
  const out = {};
  DAYS.forEach((day, i) => {
    const d = new Date(ws);
    d.setDate(d.getDate() + i);
    out[day] = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });
  return out;
}

function formatRange(weekStart) {
  if (!weekStart) return null;
  const ws = new Date(`${weekStart}T12:00:00`);
  if (isNaN(ws)) return null;
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  const start = ws.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const end   = we.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${start} – ${end}`;
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.RCAC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "RCAC_API_KEY not configured in environment" }, { status: 500 });
    }

    const { meals, weekStart } = await req.json();

    if (!Array.isArray(meals) || meals.length === 0) {
      return Response.json({ error: "No meals provided" }, { status: 400 });
    }

    // Group meals by day so the prompt clearly shows what each day contains.
    // The LLM previously had to figure this out from a flat list.
    const byDay = {};
    for (const m of meals) {
      if (!byDay[m.day]) byDay[m.day] = [];
      byDay[m.day].push(m);
    }

    const dayDates  = computeDayDates(weekStart);
    const weekRange = formatRange(weekStart);

    // Build a per-day breakdown in the prompt, with dates if we have them
    const dayLines = DAYS
      .filter(d => byDay[d])
      .map(d => {
        const dateStr = dayDates?.[d] ? ` (${dayDates[d]})` : "";
        const mealsForDay = byDay[d]
          .map(m => {
            const ing = m.ingredients?.length ? m.ingredients.join(", ") : "no ingredients listed";
            return `    • ${m.type}: "${m.title}" — ${ing}`;
          })
          .join("\n");
        return `  ${d}${dateStr}:\n${mealsForDay}`;
      })
      .join("\n\n");

    const prompt = `You are a registered nutritionist. Estimate macronutrients for one adult eating these planned meals.

WEEK: ${weekRange || "unspecified"}
SERVINGS: One adult, one serving per meal slot

PLANNED MEALS BY DAY:
${dayLines}

Rules:
- Estimate per-day totals first, then sum to weekly totals
- Use realistic single-adult portion sizes for each meal
- Skipped meal slots should not count
- Calorie estimates should be the sum of (protein × 4) + (carbs × 4) + (fat × 9), rounded to the nearest 10
- All numeric values must be integers
- Return ONLY valid JSON, no explanation, no markdown, no extra text

Required JSON shape:
{
  "weekRange": "${weekRange || ''}",
  "week": {
    "calories": <number, total kcal across all days>,
    "protein": <number, total grams>,
    "carbs": <number, total grams>,
    "fat": <number, total grams>,
    "fiber": <number, total grams>,
    "note": "<one short disclaimer about estimates being approximate>"
  },
  "days": {
${DAYS.filter(d => byDay[d]).map(d => `    "${d}": { "calories": <n>, "protein": <n>, "carbs": <n>, "fat": <n>, "fiber": <n> }`).join(",\n")}
  }
}

Only include days that appear in PLANNED MEALS BY DAY above. Weekly totals must equal the sum of the per-day values.`;

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
      console.error("RCAC API error:", errText);
      return Response.json(
        { error: `RCAC API returned ${rcacRes.status}` },
        { status: 502 }
      );
    }

    const rcacData = await rcacRes.json();
    const rawText = rcacData?.choices?.[0]?.message?.content || "";

    const macros = extractJson(rawText);
    if (!macros) {
      console.error("Failed to parse RCAC response as JSON:", rawText);
      return Response.json(
        { error: "AI returned an unparseable response. Try again." },
        { status: 502 }
      );
    }

    // Inject the week range as authoritative metadata (don't trust the LLM's copy)
    if (weekRange) macros.weekRange = weekRange;

    // Defensive: if the LLM returned mismatched week totals, recompute from days.
    if (macros.days && typeof macros.days === "object") {
      const dayKeys = Object.keys(macros.days);
      if (dayKeys.length > 0) {
        const recomputed = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        for (const d of dayKeys) {
          const dv = macros.days[d];
          if (!dv) continue;
          recomputed.calories += Number(dv.calories) || 0;
          recomputed.protein  += Number(dv.protein)  || 0;
          recomputed.carbs    += Number(dv.carbs)    || 0;
          recomputed.fat      += Number(dv.fat)      || 0;
          recomputed.fiber    += Number(dv.fiber)    || 0;
        }
        macros.week = {
          ...recomputed,
          note: macros.week?.note || "Estimates only — actual values vary by recipe and portion.",
        };
      }
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