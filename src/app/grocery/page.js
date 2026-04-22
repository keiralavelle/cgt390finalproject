"use client";

import { useState, useEffect, useRef } from "react";
import "./grocery.css";

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

export default function GroceryList() {
  const [items, setItems] = useState([]);
  const [meals, setMeals] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [selectedMealId, setSelectedMealId] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);

  // Load grocery list
  async function loadItems() {
    try {
      const res = await fetch("/api/grocery");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }

  // Load meals for the import picker
  async function loadMeals() {
    try {
      const res = await fetch("/api/meals");
      const data = await res.json();
      setMeals(Array.isArray(data) ? data : []);
    } catch { setMeals([]); }
  }

  useEffect(() => { loadItems(); loadMeals(); }, []);

  // Add a single item manually
  async function addItem(e) {
    e.preventDefault();
    const name = inputVal.trim();
    if (!name) return;
    setAdding(true);
    try {
      const res = await fetch("/api/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const item = await res.json();
      if (res.ok) {
        setItems(prev => [...prev, item]);
        setInputVal("");
        inputRef.current?.focus();
      }
    } catch { /* silent */ }
    finally { setAdding(false); }
  }

  // Import all ingredients from a meal
  async function importFromMeal() {
    if (!selectedMealId) return;
    const meal = meals.find(m => m.id === selectedMealId);
    if (!meal?.ingredients?.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: meal.ingredients.map(name => ({ name })) }),
      });
      const created = await res.json();
      if (res.ok) {
        setItems(prev => [...prev, ...(Array.isArray(created) ? created : [])]);
        setSelectedMealId("");
      }
    } catch { /* silent */ }
    finally { setImporting(false); }
  }

  // Delete a single item
  async function deleteItem(id) {
    setDeletingId(id);
    try {
      await fetch(`/api/grocery/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { /* silent */ }
    finally { setDeletingId(null); }
  }

  // Clear everything (client + server)
  async function clearAll() {
    if (!items.length) return;
    const ids = items.map(i => i.id);
    setItems([]);
    await Promise.all(ids.map(id => fetch(`/api/grocery/${id}`, { method: "DELETE" })));
  }

  const selectedMeal = meals.find(m => m.id === selectedMealId);

  return (
    <div className="grocery-page">
      <div className="grocery-container">

        {/* ── Header ── */}
        <div className="grocery-header">
          <h1 className="grocery-title">Grocery List</h1>
          {items.length > 0 && (
            <span className="grocery-count">{items.length} item{items.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* ── Add item manually ── */}
        <form className="grocery-input-row" onSubmit={addItem}>
          <input
            ref={inputRef}
            className="grocery-input"
            placeholder="Add an item…"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            disabled={adding}
          />
          <button className="grocery-btn grocery-btn--add" type="submit" disabled={adding || !inputVal.trim()}>
            {adding ? "Adding…" : "Add"}
          </button>
        </form>

        {/* ── Import from meal ── */}
        <div className="grocery-import">
          <div className="grocery-import-label">Add ingredients from a meal:</div>
          <div className="grocery-import-row">
            <select
              className="grocery-select"
              value={selectedMealId}
              onChange={e => setSelectedMealId(e.target.value)}
            >
              <option value="">Choose a meal…</option>
              {meals.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title}
                  {m.ingredients?.length ? ` (${m.ingredients.length} ingredients)` : ""}
                </option>
              ))}
            </select>
            <button
              className="grocery-btn grocery-btn--import"
              onClick={importFromMeal}
              disabled={!selectedMealId || importing || !selectedMeal?.ingredients?.length}
            >
              {importing ? "Adding…" : "Add all"}
            </button>
          </div>
          {selectedMeal && !selectedMeal.ingredients?.length && (
            <p className="grocery-import-warn">This meal has no ingredients saved.</p>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="grocery-divider" />

        {/* ── List ── */}
        {loading ? (
          <p className="grocery-status">Loading…</p>
        ) : items.length === 0 ? (
          <p className="grocery-status grocery-status--empty">
            Your list is empty. Add items above or import from a meal.
          </p>
        ) : (
          <>
            <ul className="grocery-list">
              {items.map(item => (
                <li key={item.id} className={`grocery-item ${deletingId === item.id ? "grocery-item--deleting" : ""}`}>
                  <span className="grocery-item-name">{item.name}</span>
                  {item.quantity && <span className="grocery-item-qty">{item.quantity}</span>}
                  <button
                    className="grocery-delete-btn"
                    onClick={() => deleteItem(item.id)}
                    disabled={deletingId === item.id}
                    aria-label={`Remove ${item.name}`}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>

            <button className="grocery-clear-btn" onClick={clearAll}>
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}