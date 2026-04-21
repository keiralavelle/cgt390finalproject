"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import "./home.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

const dayToEnum = {
  Monday: "MONDAY",
  Tuesday: "TUESDAY",
  Wednesday: "WEDNESDAY",
  Thursday: "THURSDAY",
  Friday: "FRIDAY",
  Saturday: "SATURDAY",
  Sunday: "SUNDAY",
};

const enumToDay = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const mealTypeToEnum = {
  Breakfast: "BREAKFAST",
  Lunch: "LUNCH",
  Dinner: "DINNER",
  Snack: "SNACK",
};

const enumToMealType = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Button({
  children,
  className = "",
  variant = "primary",
  size = "default",
  type = "button",
  ...props
}) {
  const variantClasses = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    icon: "h-9 w-9 p-0",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500",
        className
      )}
      {...props}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

const createEmptyWeek = () => {
  const week = {};
  for (const day of DAYS) {
    week[day] = {};
    for (const mealType of MEAL_TYPES) {
      week[day][mealType] = null;
    }
  }
  return week;
};

const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addWeeks = (date, weeks) => addDays(date, weeks * 7);

const formatWeekKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateForInput = (date) => formatWeekKey(date);

const formatWeekRange = (weekStart) => {
  const weekEnd = addDays(weekStart, 6);

  const startText = weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const endText = weekEnd.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startText} - ${endText}`;
};

const getWeekLabel = (weekStart) => {
  const currentWeekStart = getMondayOfWeek(new Date());
  const selectedKey = formatWeekKey(weekStart);
  const currentKey = formatWeekKey(currentWeekStart);

  if (selectedKey === currentKey) return "Current Week";
  return formatWeekRange(weekStart);
};

function mapCalendarRowsToWeek(calendarRows) {
  const week = createEmptyWeek();

  for (const row of calendarRows) {
    const day = enumToDay[row.day];
    const mealType = enumToMealType[row.slot];

    if (!day || !mealType) continue;

    week[day][mealType] = {
      id: row.id,
      mealId: row.mealId,
      title: row.meal?.title || "Untitled Meal",
      meal: row.meal || null,
    };
  }

  return week;
}

async function parseJsonSafely(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function Home() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    getMondayOfWeek(new Date())
  );
  const [calendarRows, setCalendarRows] = useState([]);
  const [meals, setMeals] = useState([]);

  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedMealType, setSelectedMealType] = useState("Breakfast");
  const [selectedMealId, setSelectedMealId] = useState("");
  const [open, setOpen] = useState(false);

  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentWeekKey = useMemo(
    () => formatWeekKey(currentWeekStart),
    [currentWeekStart]
  );

  const weekMeals = useMemo(() => {
    return mapCalendarRowsToWeek(calendarRows);
  }, [calendarRows]);

  const completedCount = useMemo(() => {
    let count = 0;
    for (const day of DAYS) {
      for (const mealType of MEAL_TYPES) {
        if (weekMeals[day]?.[mealType]) count += 1;
      }
    }
    return count;
  }, [weekMeals]);

  async function loadMeals() {
    try {
      setLoadingMeals(true);
      setError("");

      const res = await fetch("/api/meals", {
        cache: "no-store",
      });

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        throw new Error(data?.error || `Failed to load meals (${res.status})`);
      }

      setMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load meals");
      setMeals([]);
    } finally {
      setLoadingMeals(false);
    }
  }

  async function loadCalendar(weekStartDate) {
    try {
      setLoadingCalendar(true);
      setError("");

      const weekStart = formatWeekKey(weekStartDate);
      const res = await fetch(
        `/api/calendar?weekStart=${encodeURIComponent(weekStart)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to load calendar (${res.status})`
        );
      }

      setCalendarRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load calendar");
      setCalendarRows([]);
    } finally {
      setLoadingCalendar(false);
    }
  }

  useEffect(() => {
    loadMeals();
  }, []);

  useEffect(() => {
    loadCalendar(currentWeekStart);
  }, [currentWeekStart]);

  const openAddMealDialog = (day, mealType) => {
    setSelectedDay(day);
    setSelectedMealType(mealType);

    const existing = weekMeals[day]?.[mealType];
    setSelectedMealId(existing?.mealId || "");
    setOpen(true);
  };

  const saveMeal = async () => {
    if (!selectedMealId) {
      setError("Please select a meal.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealId: selectedMealId,
          weekStart: currentWeekKey,
          day: dayToEnum[selectedDay],
          slot: mealTypeToEnum[selectedMealType],
        }),
      });

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to save meal to calendar (${res.status})`
        );
      }

      await loadCalendar(currentWeekStart);
      setOpen(false);
      setSelectedMealId("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save meal");
    } finally {
      setSaving(false);
    }
  };

  const clearMeal = async (day, mealType) => {
    const existing = weekMeals[day]?.[mealType];
    if (!existing) return;

    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/calendar/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weekStart: currentWeekKey,
          day: dayToEnum[day],
          slot: mealTypeToEnum[mealType],
        }),
      });

      const data = await parseJsonSafely(res);

      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to remove meal (${res.status})`
        );
      }

      await loadCalendar(currentWeekStart);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to remove meal");
    } finally {
      setSaving(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getMondayOfWeek(new Date()));
  };

  const handleWeekPickerChange = (event) => {
    const pickedDate = new Date(`${event.target.value}T12:00:00`);
    if (!Number.isNaN(pickedDate.getTime())) {
      setCurrentWeekStart(getMondayOfWeek(pickedDate));
    }
  };

  return (
    <div className="weekly-meal-page">
      <div className="weekly-meal-container">
        <div className="weekly-meal-topbar">
          <div className="weekly-meal-heading">
            <h1>Weekly Meal Calendar</h1>
            <p>
              Plan breakfast, lunch, dinner, and snacks for any week. Meals are
              loaded from your backend.
            </p>
          </div>

          <div className="weekly-meal-controls">
            <div className="control-card week-switcher">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="week-switcher-center">
                <div className="week-switcher-label">
                  {getWeekLabel(currentWeekStart)}
                </div>
                <div className="week-switcher-range">
                  {formatWeekRange(currentWeekStart)}
                </div>
              </div>

              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="control-card date-picker-row">
              <label>Pick a date</label>
              <Input
                type="date"
                value={formatDateForInput(currentWeekStart)}
                onChange={handleWeekPickerChange}
              />
              <Button variant="secondary" onClick={goToCurrentWeek}>
                Current Week
              </Button>
            </div>

            <div className="control-card meal-count">
              <strong>Meals planned:</strong> {completedCount} / 28
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loadingCalendar || loadingMeals ? (
          <div className="rounded-3xl bg-white p-8 shadow-md text-sm text-slate-600">
            Loading your meal planner...
          </div>
        ) : (
          <div className="week-grid">
            {DAYS.map((day) => (
              <div key={`${currentWeekKey}-${day}`} className="day-column">
                <div className="day-column-header">
                  <h2>{day}</h2>
                </div>

                <div className="day-column-content">
                  {MEAL_TYPES.map((mealType) => {
                    const entry = weekMeals[day]?.[mealType];
                    const value = entry?.title || "";

                    return (
                      <div key={`${day}-${mealType}`} className="meal-card">
                        <div className="meal-card-top">
                          <h3>{mealType}</h3>

                          <div className="meal-card-actions">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openAddMealDialog(day, mealType)}
                              disabled={saving}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>

                            {value ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => clearMeal(day, mealType)}
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openAddMealDialog(day, mealType)}
                          className="meal-entry-button"
                          disabled={saving}
                        >
                          {value ? (
                            <span className="meal-entry-filled">{value}</span>
                          ) : (
                            <span className="meal-entry-empty">
                              Select a meal
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {open ? (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <div>
                  <h3>
                    {selectedDay} - {selectedMealType}
                  </h3>
                  <p>Select a saved meal for this slot.</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="modal-body">
                <div className="modal-field">
                  <label>Choose meal</label>
                  <Select
                    value={selectedMealId}
                    onChange={(e) => setSelectedMealId(e.target.value)}
                  >
                    <option value="">Select a meal</option>
                    {meals.map((meal) => (
                      <option key={meal.id} value={meal.id}>
                        {meal.title}
                      </option>
                    ))}
                  </Select>
                </div>

                {meals.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No meals found yet. Create a meal first so you can assign it
                    to the calendar.
                  </div>
                ) : null}

                <div className="modal-actions">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={saving}
                  >
                    Cancel 
                  </Button>
                  <Button onClick={saveMeal} disabled={saving || !selectedMealId}>
                    {saving ? "Saving..." : "Save Meal"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}