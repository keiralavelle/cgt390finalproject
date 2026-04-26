"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, DollarSign, ChefHat, X, Check, Plus } from "lucide-react";
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

  // Cost estimation state
  const [cost, setCost]               = useState(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError]     = useState("");

  // Meal suggestions state
  const [suggestions, setSuggestions]         = useState([]);
  const [suggestLoading, setSuggestLoading]   = useState(false);
  const [suggestError, setSuggestError]       = useState("");
  const [savingTitles, setSavingTitles]       = useState(new Set()); // titles currently being saved
  const [savedTitles, setSavedTitles]         = useState(new Set()); // titles already saved

  async function loadItems() {
    try {
      const res = await fetch("/api/grocery");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }

  async function loadMeals() {
    try {
      const res = await fetch("/api/meals");
      const data = await res.json();
      setMeals(Array.isArray(data) ? data : []);
    } catch { setMeals([]); }
  }

  useEffect(() => { loadItems(); loadMeals(); }, []);

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

  async function deleteItem(id) {
    setDeletingId(id);
    try {
      await fetch(`/api/grocery/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { /* silent */ }
    finally { setDeletingId(null); }
  }

  async function clearAll() {
    if (!items.length) return;
    const ids = items.map(i => i.id);
    setItems([]);
    setCost(null); // estimates are stale once list changes
    await Promise.all(ids.map(id => fetch(`/api/grocery/${id}`, { method: "DELETE" })));
  }

  // ── Cost estimation ─────────────────────────────────────────────
  async function estimateCost() {
    if (!items.length) return;
    setCostLoading(true); setCostError("");
    try {
      const res  = await fetch("/api/grocery/cost", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setCost(data);
    } catch (e) { setCostError(e.message); }
    finally { setCostLoading(false); }
  }

  // ── Meal suggestions ────────────────────────────────────────────
  async function getSuggestions() {
    if (!items.length) return;
    setSuggestLoading(true); setSuggestError(""); setSuggestions([]);
    try {
      const res  = await fetch("/api/meals/suggest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (e) { setSuggestError(e.message); }
    finally { setSuggestLoading(false); }
  }

  async function saveSuggestion(s) {
    if (savingTitles.has(s.title) || savedTitles.has(s.title)) return;
    setSavingTitles(prev => new Set(prev).add(s.title));
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:        s.title,
          description:  s.description,
          ingredients:  s.ingredients,
          instructions: s.instructions,
        }),
      });
      if (res.ok) {
        setSavedTitles(prev => new Set(prev).add(s.title));
        // Refresh meals list so it shows up in pickers
        loadMeals();
      } else {
        // The DB has a unique constraint on (userId, title). If this fails because
        // the meal already exists, treat it as already-saved rather than silently failing.
        const data = await res.json().catch(() => ({}));
        const msg  = (data?.error || "").toLowerCase();
        if (msg.includes("unique") || msg.includes("already") || res.status === 409) {
          setSavedTitles(prev => new Set(prev).add(s.title));
        }
      }
    } catch { /* silent */ }
    finally {
      setSavingTitles(prev => { const next = new Set(prev); next.delete(s.title); return next; });
    }
  }

  function dismissSuggestions() {
    setSuggestions([]);
    setSuggestError("");
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
              {items.map(item => {
                const itemCost = cost?.items?.find(c => c.name === item.name);
                return (
                  <li key={item.id} className={`grocery-item ${deletingId === item.id ? "grocery-item--deleting" : ""}`}>
                    <span className="grocery-item-name">{item.name}</span>
                    {item.quantity && <span className="grocery-item-qty">{item.quantity}</span>}
                    {itemCost && (
                      <span className="grocery-item-cost">
                        ${Number(itemCost.estimatedCost).toFixed(2)}
                      </span>
                    )}
                    <button
                      className="grocery-delete-btn"
                      onClick={() => deleteItem(item.id)}
                      disabled={deletingId === item.id}
                      aria-label={`Remove ${item.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                );
              })}
            </ul>

            <button className="grocery-clear-btn" onClick={clearAll}>
              Clear all
            </button>
          </>
        )}

        {/* ── AI tools section ── */}
        {items.length > 0 && (
          <div className="grocery-ai">
            <div className="grocery-ai-header">
              <Sparkles size={15} />
              <span>AI tools</span>
            </div>

            <div className="grocery-ai-actions">
              <button
                className="grocery-ai-btn"
                onClick={estimateCost}
                disabled={costLoading}
              >
                <DollarSign size={14} />
                {costLoading
                  ? "Estimating…"
                  : cost ? "Re-estimate cost" : "Estimate weekly cost"}
              </button>

              <button
                className="grocery-ai-btn"
                onClick={getSuggestions}
                disabled={suggestLoading}
              >
                <ChefHat size={14} />
                {suggestLoading
                  ? "Thinking…"
                  : suggestions.length ? "Get more suggestions" : "Suggest meals"}
              </button>
            </div>

            {/* Cost result */}
            {costError && <p className="grocery-ai-error">⚠ {costError}</p>}
            {cost && (
              <div className="grocery-cost-result">
                <div className="grocery-cost-total-row">
                  <span className="grocery-cost-label">Estimated total</span>
                  <span className="grocery-cost-total">
                    ${Number(cost.total || 0).toFixed(2)}
                  </span>
                </div>
                {cost.note && <p className="grocery-cost-note">{cost.note}</p>}
              </div>
            )}

            {/* Suggestions result */}
            {suggestError && <p className="grocery-ai-error">⚠ {suggestError}</p>}
            {suggestions.length > 0 && (
              <div className="grocery-suggestions">
                <div className="grocery-suggestions-header">
                  <span className="grocery-suggestions-title">Meal ideas based on your list</span>
                  <button
                    className="grocery-suggestions-close"
                    onClick={dismissSuggestions}
                    aria-label="Dismiss suggestions"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grocery-suggestions-grid">
                  {suggestions.map((s) => {
                    const isSaving = savingTitles.has(s.title);
                    // Existing-in-DB check: case-insensitive title match against the meals list
                    const titleNorm = s.title.trim().toLowerCase();
                    const existsInMeals = meals.some(m => m.title?.trim().toLowerCase() === titleNorm);
                    const isSaved  = savedTitles.has(s.title) || existsInMeals;
                    return (
                      <div key={s.title} className="grocery-suggestion-card">
                        <h3 className="grocery-suggestion-title">{s.title}</h3>
                        {s.description && (
                          <p className="grocery-suggestion-desc">{s.description}</p>
                        )}
                        {s.usesFromList?.length > 0 && (
                          <div className="grocery-suggestion-uses">
                            <span className="grocery-suggestion-uses-label">Uses:</span>
                            {s.usesFromList.map(u => (
                              <span key={u} className="grocery-suggestion-tag">{u}</span>
                            ))}
                          </div>
                        )}
                        <details className="grocery-suggestion-details">
                          <summary>View ingredients & steps</summary>
                          {s.ingredients?.length > 0 && (
                            <div className="grocery-suggestion-section">
                              <strong>Ingredients</strong>
                              <ul>
                                {s.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                              </ul>
                            </div>
                          )}
                          {s.instructions?.length > 0 && (
                            <div className="grocery-suggestion-section">
                              <strong>Instructions</strong>
                              <ol>
                                {s.instructions.map((step, i) => <li key={i}>{step}</li>)}
                              </ol>
                            </div>
                          )}
                        </details>
                        <button
                          className={`grocery-suggestion-save ${isSaved ? "grocery-suggestion-save--done" : ""}`}
                          onClick={() => saveSuggestion(s)}
                          disabled={isSaving || isSaved}
                        >
                          {isSaved
                            ? <><Check size={13}/> {existsInMeals && !savedTitles.has(s.title) ? "Already in your meals" : "Saved"}</>
                            : isSaving
                              ? "Saving…"
                              : <><Plus size={13}/> Save to my meals</>
                          }
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
