"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Plus, Sparkles, Calendar } from "lucide-react";
import "./home.css";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snack"];
const TOTAL_SLOTS = 28;

const dayToEnum      = { Monday:"MONDAY",Tuesday:"TUESDAY",Wednesday:"WEDNESDAY",Thursday:"THURSDAY",Friday:"FRIDAY",Saturday:"SATURDAY",Sunday:"SUNDAY" };
const enumToDay      = { MONDAY:"Monday",TUESDAY:"Tuesday",WEDNESDAY:"Wednesday",THURSDAY:"Thursday",FRIDAY:"Friday",SATURDAY:"Saturday",SUNDAY:"Sunday" };
const mealTypeToEnum = { Breakfast:"BREAKFAST",Lunch:"LUNCH",Dinner:"DINNER",Snack:"SNACK" };
const enumToMealType = { BREAKFAST:"Breakfast",LUNCH:"Lunch",DINNER:"Dinner",SNACK:"Snack" };

// Sentinel title stored in DB for "no meal planned" slots.
// Must match the value in /api/calendar/route.js
const NO_MEAL_TITLE = "__NO_MEAL__";

const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
const addWeeks    = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n * 7); return d; };
const formatKey   = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const formatRange = (ws) => {
  const end = new Date(ws); end.setDate(end.getDate() + 6);
  return `${ws.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${end.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`;
};

// Returns a Date for each of the 7 days starting at weekStart
function getWeekDates(weekStart) {
  return DAYS.map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// Each slot entry gets an isSkipped flag so the UI knows to render "No meal"
function buildWeek(rows) {
  const week = {};
  for (const day of DAYS) { week[day] = {}; for (const t of MEAL_TYPES) week[day][t] = null; }
  for (const row of rows) {
    const day = enumToDay[row.day];
    const t   = enumToMealType[row.slot];
    if (!day || !t) continue;
    week[day][t] = {
      id:          row.id,
      mealId:      row.mealId,
      title:       row.meal?.title || "Untitled",
      ingredients: row.meal?.ingredients || [],
      isSkipped:   row.meal?.title === NO_MEAL_TITLE,
    };
  }
  return week;
}

// ── Plate pie chart ──────────────────────────────────────────────
// viewBox 80×56: plate centred at (40,28), fork at x≈9, knife at x≈70
// Both utensils sit outside the plate rim (which ends at x≈19 and x≈61).
function PlatePieChart({ planned, total }) {
  const pct = total > 0 ? planned / total : 0;
  const CX = 40, CY = 28, R_FOOD = 15, R_WELL = 17, R_RIM = 21;

  function pieSlicePath(cx, cy, r, p) {
    if (p <= 0) return "";
    if (p >= 1) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
    const angle = p * 2 * Math.PI;
    const sx = cx + r * Math.cos(-Math.PI / 2);
    const sy = cy + r * Math.sin(-Math.PI / 2);
    const ex = cx + r * Math.cos(-Math.PI / 2 + angle);
    const ey = cy + r * Math.sin(-Math.PI / 2 + angle);
    return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${ex} ${ey} Z`;
  }

  const fillPath  = pieSlicePath(CX, CY, R_FOOD, pct);
  const fillColor = pct === 0 ? "#e4e7e2" : pct === 1 ? "#22c55e" : pct > 0.6 ? "#4a7c59" : "#6aab7a";

  return (
    <svg className="plate-svg" width={80} height={56} viewBox="0 0 80 56"
      aria-label={`${planned} of ${total} meals planned`}>
      {/* Fork — x range 7-11, well left of plate edge at x≈19 */}
      <g stroke="#b8b4ad" strokeWidth="1.1" strokeLinecap="round" fill="none">
        <line x1="7"  y1="8"  x2="7"  y2="18" />
        <line x1="9"  y1="8"  x2="9"  y2="18" />
        <line x1="11" y1="8"  x2="11" y2="18" />
        <path d="M7 18 Q9 21 11 18" />
        <line x1="9" y1="21" x2="9" y2="48" />
      </g>

      {/* Knife — x range 68-73, well right of plate edge at x≈61 */}
      <g stroke="#b8b4ad" strokeWidth="1.1" strokeLinecap="round" fill="none">
        <path d="M70 8 Q73 14 70 22" />
        <line x1="70" y1="8" x2="70" y2="48" />
      </g>

      {/* Plate shadow */}
      <circle cx={CX} cy={CY} r={R_RIM + 1} fill="#dedad4" />
      {/* Outer rim */}
      <circle cx={CX} cy={CY} r={R_RIM} fill="#f5f3ef" />
      {/* Inner rim ring */}
      <circle cx={CX} cy={CY} r={R_WELL} fill="none" stroke="#dbd8d2" strokeWidth="0.75" />
      {/* Food area */}
      <circle cx={CX} cy={CY} r={R_FOOD} fill="#ede9e2" />
      {/* Pie fill */}
      {fillPath && <path d={fillPath} fill={fillColor} style={{ transition: "fill 0.35s ease" }} />}
      {/* Centre dot */}
      <circle cx={CX} cy={CY} r={1} fill="rgba(0,0,0,0.1)" />
    </svg>
  );
}

// ── Macro bar ────────────────────────────────────────────────────
function MacroBar({ label, value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="macro-bar-row">
      <span className="macro-bar-label">{label}</span>
      <div className="macro-bar-track">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="macro-bar-value">{value}g</span>
    </div>
  );
}

// ── Macro panel ──────────────────────────────────────────────────
function MacroPanel({ week }) {
  const [macros, setMacros]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [view, setView]       = useState("week");

  const plannedMeals = useMemo(() => {
    const result = [];
    for (const day of DAYS)
      for (const type of MEAL_TYPES) {
        const entry = week[day]?.[type];
        // Only include real meals (not skipped sentinels) in macro estimates
        if (entry && !entry.isSkipped)
          result.push({ day, type, title: entry.title, ingredients: entry.ingredients });
      }
    return result;
  }, [week]);

  async function estimate() {
    if (!plannedMeals.length) return;
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/macros", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ meals: plannedMeals }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMacros(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const displayMacros = useMemo(() => {
    if (!macros) return null;
    return view === "week" ? macros.week : (macros.days?.[view] || null);
  }, [macros, view]);

  return (
    <div className="macro-panel">
      <div className="macro-panel-header">
        <div className="macro-panel-title"><Sparkles size={15} /> AI Macro Estimate</div>
        <button className="macro-estimate-btn" onClick={estimate} disabled={loading || !plannedMeals.length}>
          {loading ? "Estimating…" : macros ? "Re-estimate" : "Estimate"}
        </button>
      </div>
      {!plannedMeals.length && <p className="macro-empty">Plan some meals to get an estimate.</p>}
      {error && <p className="macro-error">⚠ {error}</p>}
      {macros && (
        <>
          <div className="macro-tabs">
            <button className={`macro-tab ${view==="week"?"macro-tab--active":""}`} onClick={()=>setView("week")}>Week</button>
            {DAYS.map(d=>(
              <button key={d} className={`macro-tab ${view===d?"macro-tab--active":""}`} onClick={()=>setView(d)}>{d.slice(0,3)}</button>
            ))}
          </div>
          {displayMacros ? (
            <div className="macro-data">
              <div className="macro-kcal">
                <span className="macro-kcal-num">{displayMacros.calories}</span>
                <span className="macro-kcal-label">kcal {view==="week"?"/ week":"/ day"}</span>
              </div>
              <div className="macro-bars">
                <MacroBar label="Protein" value={displayMacros.protein} max={view==="week"?1000:150} color="#4a7c59" />
                <MacroBar label="Carbs"   value={displayMacros.carbs}   max={view==="week"?2200:325} color="#e6a817" />
                <MacroBar label="Fat"     value={displayMacros.fat}     max={view==="week"?1200:178} color="#c84b2f" />
                <MacroBar label="Fiber"   value={displayMacros.fiber}   max={view==="week"?210:30}   color="#7a9e87" />
              </div>
              {displayMacros.note && <p className="macro-note">{displayMacros.note}</p>}
            </div>
          ) : (
            <p className="macro-empty">No meals planned for {view}.</p>
          )}
        </>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function Home() {
  const [weekStart, setWeekStart]           = useState(getMondayOfWeek(new Date()));
  const [calRows, setCalRows]               = useState([]);
  const [meals, setMeals]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");
  const [modal, setModal]                   = useState(null);
  const [selectedMealId, setSelectedMealId] = useState("");
  const dateInputRef = useRef(null);

  const weekKey   = useMemo(() => formatKey(weekStart), [weekStart]);
  const week      = useMemo(() => buildWeek(calRows), [calRows]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const today     = useMemo(() => new Date(), []);

  // Count both real meals and intentionally-skipped slots
  const planned = useMemo(() =>
    DAYS.reduce((a, d) => a + MEAL_TYPES.filter(t => week[d]?.[t]).length, 0),
  [week]);

  async function loadCalendar(ws) {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/calendar?weekStart=${formatKey(ws)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setCalRows(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); setCalRows([]); }
    finally { setLoading(false); }
  }

  async function loadMeals() {
    try {
      const res  = await fetch("/api/meals");
      const data = await res.json();
      // Hide the sentinel meal from the picker
      setMeals((Array.isArray(data) ? data : []).filter(m => m.title !== NO_MEAL_TITLE));
    } catch { setMeals([]); }
  }

  useEffect(() => { loadMeals(); }, []);
  useEffect(() => { loadCalendar(weekStart); }, [weekStart]);

  function openModal(day, mealType) {
    setModal({ day, mealType });
    const entry = week[day]?.[mealType];
    // Pre-select "NO_MEAL" if this slot is already skipped
    setSelectedMealId(entry?.isSkipped ? "NO_MEAL" : (entry?.mealId || ""));
    setError("");
  }

  async function saveSlot() {
    const { day, mealType } = modal;
    if (!selectedMealId) return;

    setSaving(true); setError("");
    try {
      // Send either "NO_MEAL" or a real mealId — the API handles both
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealId:    selectedMealId,
          weekStart: weekKey,
          day:       dayToEnum[day],
          slot:      mealTypeToEnum[mealType],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      await loadCalendar(weekStart);
      setModal(null);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function clearSlot(day, mealType) {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/calendar/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekKey, day: dayToEnum[day], slot: mealTypeToEnum[mealType] }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d?.error || "Failed"); }
      await loadCalendar(weekStart);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleDatePick(e) {
    const picked = new Date(`${e.target.value}T12:00:00`);
    if (!isNaN(picked)) setWeekStart(getMondayOfWeek(picked));
  }

  const isNoMeal = selectedMealId === "NO_MEAL";

  return (
    <div className="cal-page">
      {/* ── Header ── */}
      <div className="cal-header">
        <h1 className="cal-title">Meal Calendar</h1>

        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => setWeekStart(w => addWeeks(w,-1))}><ChevronLeft size={16}/></button>
          <div className="cal-week-label">
            <span className="cal-week-range">{formatRange(weekStart)}</span>
            <button className="cal-today-btn" onClick={() => setWeekStart(getMondayOfWeek(new Date()))}>Today</button>
          </div>
          <button className="cal-nav-btn" onClick={() => setWeekStart(w => addWeeks(w,1))}><ChevronRight size={16}/></button>
          <div className="cal-datepicker-wrap">
            <button className="cal-nav-btn" onClick={() => dateInputRef.current?.showPicker()} title="Pick a date">
              <Calendar size={15}/>
            </button>
            <input ref={dateInputRef} type="date" className="cal-date-input-hidden" value={formatKey(weekStart)} onChange={handleDatePick} tabIndex={-1}/>
          </div>
        </div>

        <div className="cal-progress">
          <PlatePieChart planned={planned} total={TOTAL_SLOTS}/>
          <div className="cal-progress-text">
            <span className="cal-progress-num">{planned}<span className="cal-progress-denom">/{TOTAL_SLOTS}</span></span>
            <span className="cal-progress-label">meals planned</span>
          </div>
        </div>
      </div>

      {error && <div className="cal-error">{error}</div>}

      <div className="cal-body">
        {loading ? (
          <div className="cal-loading">Loading…</div>
        ) : (
          <div className="cal-grid">
            {DAYS.map((day, dayIdx) => {
              const dayDate  = weekDates[dayIdx];
              const isToday  = isSameDay(dayDate, today);
              const dateNum  = dayDate.getDate();
              const monthStr = dayDate.toLocaleDateString(undefined, { month: "short" });
              return (
              <div key={day} className={`cal-day ${isToday ? "cal-day--today" : ""}`}>
                <div className="cal-day-name">
                  <span className="cal-day-abbr">{day.slice(0,3)}</span>
                  <span className={`cal-day-date ${isToday ? "cal-day-date--today" : ""}`}>
                    {monthStr} {dateNum}
                  </span>
                </div>
                {MEAL_TYPES.map(type => {
                  const entry = week[day]?.[type];
                  return (
                    <div key={type} className={`cal-slot ${entry && !entry.isSkipped ? "cal-slot--filled" : ""} ${entry?.isSkipped ? "cal-slot--skipped" : ""}`}>
                      <span className="cal-slot-type">{type}</span>
                      {entry ? (
                        <div className="cal-slot-meal">
                          <button
                            className={`cal-slot-name ${entry.isSkipped ? "cal-slot-name--skip" : ""}`}
                            onClick={() => openModal(day, type)}
                            disabled={saving}
                          >
                            {entry.isSkipped ? "No meal" : entry.title}
                          </button>
                          <button className="cal-slot-clear" onClick={() => clearSlot(day, type)} disabled={saving} aria-label="Remove">
                            <X size={12}/>
                          </button>
                        </div>
                      ) : (
                        <button className="cal-slot-add" onClick={() => openModal(day, type)} disabled={saving}>
                          <Plus size={12}/> Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ); })}
          </div>
        )}
        {!loading && <MacroPanel week={week}/>}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <div className="cal-modal-overlay" onClick={() => setModal(null)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h2>{modal.day} — {modal.mealType}</h2>
              <button className="cal-modal-close" onClick={() => setModal(null)}><X size={16}/></button>
            </div>

            <div className="cal-modal-list">
              {/* No meal — always at top */}
              <button
                className={`cal-meal-option cal-meal-option--none ${isNoMeal ? "cal-meal-option--none-selected" : ""}`}
                onClick={() => setSelectedMealId("NO_MEAL")}
              >
                <span className="cal-no-meal-icon"><X size={12}/></span>
                No meal planned
              </button>

              <div className="cal-modal-divider"/>

              {meals.length === 0 ? (
                <p className="cal-modal-empty">No meals yet — add some from the Add Meal page.</p>
              ) : meals.map(meal => (
                <button
                  key={meal.id}
                  className={`cal-meal-option ${selectedMealId === meal.id ? "cal-meal-option--selected" : ""}`}
                  onClick={() => setSelectedMealId(meal.id)}
                >
                  {meal.title}
                </button>
              ))}
            </div>

            {error && <p className="cal-modal-error">{error}</p>}

            <div className="cal-modal-actions">
              <button className="cal-btn cal-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button
                className={`cal-btn ${isNoMeal ? "cal-btn--danger" : "cal-btn--primary"}`}
                onClick={saveSlot}
                disabled={saving || !selectedMealId}
              >
                {saving ? "Saving…" : isNoMeal ? "Mark as skipped" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}