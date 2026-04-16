"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import "./Home.css";

const STORAGE_KEY = "weekly-meal-calendar-v2";

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

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className = "" }) {
  return <div className={cn("rounded-3xl bg-white shadow-md", className)}>{children}</div>;
}

function CardHeader({ children, className = "" }) {
  return <div className={cn("px-5 pt-5", className)}>{children}</div>;
}

function CardTitle({ children, className = "" }) {
  return <h2 className={cn("text-lg font-semibold text-slate-900", className)}>{children}</h2>;
}

function CardContent({ children, className = "" }) {
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
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
        className,
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
        className,
      )}
      {...props}
    />
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

const createEmptyWeek = () => {
  const week = {};
  for (const day of DAYS) {
    week[day] = {};
    for (const mealType of MEAL_TYPES) {
      week[day][mealType] = "";
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

export default function Home() {
  const [allWeeks, setAllWeeks] = useState({});
  const [currentWeekStart, setCurrentWeekStart] = useState(getMondayOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedMealType, setSelectedMealType] = useState("Breakfast");
  const [mealInput, setMealInput] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAllWeeks(parsed);
      }
    } catch (error) {
      console.error("Failed to load meals from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allWeeks));
    } catch (error) {
      console.error("Failed to save meals to localStorage:", error);
    }
  }, [allWeeks]);

  const currentWeekKey = useMemo(() => formatWeekKey(currentWeekStart), [currentWeekStart]);

  const weekMeals = useMemo(() => {
    return allWeeks[currentWeekKey] || createEmptyWeek();
  }, [allWeeks, currentWeekKey]);

  const completedCount = useMemo(() => {
    let count = 0;
    for (const day of DAYS) {
      for (const mealType of MEAL_TYPES) {
        if (weekMeals[day]?.[mealType]?.trim()) count += 1;
      }
    }
    return count;
  }, [weekMeals]);

  const saveWeekMeals = (updatedWeekMeals) => {
    setAllWeeks((prev) => ({
      ...prev,
      [currentWeekKey]: updatedWeekMeals,
    }));
  };

  const openAddMealDialog = (day, mealType) => {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setMealInput(weekMeals[day]?.[mealType] || "");
    setOpen(true);
  };

  const saveMeal = () => {
    const updatedWeekMeals = {
      ...weekMeals,
      [selectedDay]: {
        ...weekMeals[selectedDay],
        [selectedMealType]: mealInput.trim(),
      },
    };

    saveWeekMeals(updatedWeekMeals);
    setOpen(false);
    setMealInput("");
  };

  const clearMeal = (day, mealType) => {
    const updatedWeekMeals = {
      ...weekMeals,
      [day]: {
        ...weekMeals[day],
        [mealType]: "",
      },
    };

    saveWeekMeals(updatedWeekMeals);
  };

  const clearCurrentWeek = () => {
    saveWeekMeals(createEmptyWeek());
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
            <p>Plan breakfast, lunch, dinner, and snacks for any week. Meals are saved in localStorage by week.</p>
          </div>

          <div className="weekly-meal-controls">
            <div className="control-card week-switcher">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="week-switcher-center">
                <div className="week-switcher-label">{getWeekLabel(currentWeekStart)}</div>
                <div className="week-switcher-range">{formatWeekRange(currentWeekStart)}</div>
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

            <Button variant="destructive" onClick={clearCurrentWeek}>
              Clear This Week
            </Button>
          </div>
        </div>

        <div className="week-grid">
          {DAYS.map((day) => (
            <div key={`${currentWeekKey}-${day}`} className="day-column">
              <div className="day-column-header">
                <h2>{day}</h2>
              </div>

              <div className="day-column-content">
                {MEAL_TYPES.map((mealType) => {
                  const value = weekMeals[day]?.[mealType] || "";

                  return (
                    <div key={`${day}-${mealType}`} className="meal-card">
                      <div className="meal-card-top">
                        <h3>{mealType}</h3>

                        <div className="meal-card-actions">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openAddMealDialog(day, mealType)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>

                          {value ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => clearMeal(day, mealType)}
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
                      >
                        {value ? (
                          <span className="meal-entry-filled">{value}</span>
                        ) : (
                          <span className="meal-entry-empty">Add a meal</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {open ? (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <div>
                  <h3>
                    {selectedDay} - {selectedMealType}
                  </h3>
                  <p>Add or edit the meal for this slot.</p>
                </div>

                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="modal-body">
                <div className="modal-field">
                  <label>Meal name</label>
                  <Input
                    value={mealInput}
                    onChange={(e) => setMealInput(e.target.value)}
                    placeholder={`Enter ${selectedMealType.toLowerCase()} meal`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveMeal();
                    }}
                  />
                </div>

                <div className="modal-actions">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveMeal}>Save Meal</Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
