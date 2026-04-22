"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Plus, Sparkles, Calendar } from "lucide-react";
import "./home.css";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MEAL_TYPES = ["Breakfast","Lunch","Dinner","Snack"];

const dayToEnum   = { Monday:"MONDAY",Tuesday:"TUESDAY",Wednesday:"WEDNESDAY",Thursday:"THURSDAY",Friday:"FRIDAY",Saturday:"SATURDAY",Sunday:"SUNDAY" };
const enumToDay   = { MONDAY:"Monday",TUESDAY:"Tuesday",WEDNESDAY:"Wednesday",THURSDAY:"Thursday",FRIDAY:"Friday",SATURDAY:"Saturday",SUNDAY:"Sunday" };
const mealTypeToEnum = { Breakfast:"BREAKFAST",Lunch:"LUNCH",Dinner:"DINNER",Snack:"SNACK" };
const enumToMealType = { BREAKFAST:"Breakfast",LUNCH:"Lunch",DINNER:"Dinner",SNACK:"Snack" };

const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
const addWeeks  = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n * 7); return d; };
const formatKey = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const formatRange = (ws) => {
  const end = new Date(ws); end.setDate(end.getDate() + 6);
  return `${ws.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${end.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}`;
};

function buildWeek(rows) {
  const week = {};
  for (const day of DAYS) { week[day] = {}; for (const t of MEAL_TYPES) week[day][t] = null; }
  for (const row of rows) {
    const day = enumToDay[row.day]; const t = enumToMealType[row.slot];
    if (day && t) week[day][t] = { id: row.id, mealId: row.mealId, title: row.meal?.title || "Untitled", ingredients: row.meal?.ingredients || [] };
  }
  return week;
}

// ── Macro bar component ──────────────────────────────────────────
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
function MacroPanel({ week, meals }) {
  const [macros, setMacros]     = useState(null); // { days: {...}, week: {...} }
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [view, setView]         = useState("week"); // "week" | day name

  const plannedMeals = useMemo(() => {
    const result = [];
    for (const day of DAYS) {
      for (const type of MEAL_TYPES) {
        const entry = week[day]?.[type];
        if (entry) result.push({ day, type, title: entry.title, ingredients: entry.ingredients });
      }
    }
    return result;
  }, [week]);

  async function estimate() {
    if (!plannedMeals.length) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals: plannedMeals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setMacros(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const displayMacros = useMemo(() => {
    if (!macros) return null;
    if (view === "week") return macros.week;
    return macros.days?.[view] || null;
  }, [macros, view]);

  return (
    <div className="macro-panel">
      <div className="macro-panel-header">
        <div className="macro-panel-title">
          <Sparkles size={15} />
          AI Macro Estimate
        </div>
        <button
          className="macro-estimate-btn"
          onClick={estimate}
          disabled={loading || !plannedMeals.length}
        >
          {loading ? "Estimating…" : macros ? "Re-estimate" : "Estimate"}
        </button>
      </div>

      {!plannedMeals.length && (
        <p className="macro-empty">Plan some meals to get an estimate.</p>
      )}

      {error && <p className="macro-error">⚠ {error}</p>}

      {macros && (
        <>
          {/* Day tabs */}
          <div className="macro-tabs">
            <button className={`macro-tab ${view === "week" ? "macro-tab--active" : ""}`} onClick={() => setView("week")}>Week</button>
            {DAYS.map(d => (
              <button
                key={d}
                className={`macro-tab ${view === d ? "macro-tab--active" : ""}`}
                onClick={() => setView(d)}
              >
                {d.slice(0,3)}
              </button>
            ))}
          </div>

          {displayMacros ? (
            <div className="macro-data">
              <div className="macro-kcal">
                <span className="macro-kcal-num">{displayMacros.calories}</span>
                <span className="macro-kcal-label">kcal {view === "week" ? "/ week" : "/ day"}</span>
              </div>
              <div className="macro-bars">
                <MacroBar label="Protein"  value={displayMacros.protein}  max={view === "week" ? 1000 : 150} color="#4a7c59" />
                <MacroBar label="Carbs"    value={displayMacros.carbs}    max={view === "week" ? 2200 : 325} color="#e6a817" />
                <MacroBar label="Fat"      value={displayMacros.fat}      max={view === "week" ? 1200 : 178} color="#c84b2f" />
                <MacroBar label="Fiber"    value={displayMacros.fiber}    max={view === "week" ? 210  : 30}  color="#7a9e87" />
              </div>
              {displayMacros.note && (
                <p className="macro-note">{displayMacros.note}</p>
              )}
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
  const [weekStart, setWeekStart] = useState(getMondayOfWeek(new Date()));
  const [calRows, setCalRows]     = useState([]);
  const [meals, setMeals]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const [modal, setModal]           = useState(null);
  const [selectedMealId, setSelectedMealId] = useState("");

  const dateInputRef = useRef(null);

  const weekKey = useMemo(() => formatKey(weekStart), [weekStart]);
  const week    = useMemo(() => buildWeek(calRows), [calRows]);
  const planned = useMemo(() => DAYS.reduce((a, d) => a + MEAL_TYPES.filter(t => week[d]?.[t]).length, 0), [week]);

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
      setMeals(Array.isArray(data) ? data : []);
    } catch { setMeals([]); }
  }

  useEffect(() => { loadMeals(); }, []);
  useEffect(() => { loadCalendar(weekStart); }, [weekStart]);

  function openModal(day, mealType) {
    setModal({ day, mealType });
    setSelectedMealId(week[day]?.[mealType]?.mealId || "");
    setError("");
  }

  async function saveMeal() {
    if (!selectedMealId) return;
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealId: selectedMealId, weekStart: weekKey, day: dayToEnum[modal.day], slot: mealTypeToEnum[modal.mealType] }),
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

  return (
    <div className="cal-page">
      {/* ── Header ── */}
      <div className="cal-header">
        <h1 className="cal-title">Meal Calendar</h1>

        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => setWeekStart(w => addWeeks(w, -1))}>
            <ChevronLeft size={16} />
          </button>

          <div className="cal-week-label">
            <span className="cal-week-range">{formatRange(weekStart)}</span>
            <button className="cal-today-btn" onClick={() => setWeekStart(getMondayOfWeek(new Date()))}>Today</button>
          </div>

          <button className="cal-nav-btn" onClick={() => setWeekStart(w => addWeeks(w, 1))}>
            <ChevronRight size={16} />
          </button>

          {/* Hidden native date input, triggered by calendar icon button */}
          <div className="cal-datepicker-wrap">
            <button className="cal-nav-btn" onClick={() => dateInputRef.current?.showPicker()} title="Pick a date">
              <Calendar size={15} />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              className="cal-date-input-hidden"
              value={formatKey(weekStart)}
              onChange={handleDatePick}
              tabIndex={-1}
            />
          </div>
        </div>

        <span className="cal-count">{planned} / 28 planned</span>
      </div>

      {error && <div className="cal-error">{error}</div>}

      <div className="cal-body">
        {/* ── Grid ── */}
        {loading ? (
          <div className="cal-loading">Loading…</div>
        ) : (
          <div className="cal-grid">
            {DAYS.map(day => (
              <div key={day} className="cal-day">
                <div className="cal-day-name">{day.slice(0,3)}</div>
                {MEAL_TYPES.map(type => {
                  const entry = week[day]?.[type];
                  return (
                    <div key={type} className={`cal-slot ${entry ? "cal-slot--filled" : ""}`}>
                      <span className="cal-slot-type">{type}</span>
                      {entry ? (
                        <div className="cal-slot-meal">
                          <button className="cal-slot-name" onClick={() => openModal(day, type)} disabled={saving}>
                            {entry.title}
                          </button>
                          <button className="cal-slot-clear" onClick={() => clearSlot(day, type)} disabled={saving} aria-label="Remove">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button className="cal-slot-add" onClick={() => openModal(day, type)} disabled={saving}>
                          <Plus size={12} /> Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── Macro panel ── */}
        {!loading && <MacroPanel week={week} meals={meals} />}
      </div>

      {/* ── Meal picker modal ── */}
      {modal && (
        <div className="cal-modal-overlay" onClick={() => setModal(null)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h2>{modal.day} — {modal.mealType}</h2>
              <button className="cal-modal-close" onClick={() => setModal(null)}><X size={16} /></button>
            </div>

            {meals.length === 0 ? (
              <p className="cal-modal-empty">No meals yet. Add some meals first.</p>
            ) : (
              <div className="cal-modal-list">
                {meals.map(meal => (
                  <button
                    key={meal.id}
                    className={`cal-meal-option ${selectedMealId === meal.id ? "cal-meal-option--selected" : ""}`}
                    onClick={() => setSelectedMealId(meal.id)}
                  >
                    {meal.title}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="cal-modal-error">{error}</p>}

            <div className="cal-modal-actions">
              <button className="cal-btn cal-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="cal-btn cal-btn--primary" onClick={saveMeal} disabled={saving || !selectedMealId}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}