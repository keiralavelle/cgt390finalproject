"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./search.module.css";

// ─── Icons ────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2h1l.4 2M7 13h10l4-8H5.4M7 13L5.4 4M7 13l-2 9m12-9l2 9M9 22h6" />
  </svg>
);

// ─── Meal Card ────────────────────────────────────────────────
function MealCard({ meal, onFavoriteToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  async function handleFavorite(e) {
    // Don't expand/collapse when clicking the heart
    e.stopPropagation();
    if (favoriting) return;
    setFavoriting(true);
    try {
      const res = await fetch(`/api/meals/${meal.id}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !meal.isFavorite }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      onFavoriteToggle(meal.id, updated.isFavorite);
    } catch (err) {
      console.error(err);
    } finally {
      setFavoriting(false);
    }
  }

  return (
    <article className={`${styles.card} ${expanded ? styles.cardExpanded : ""}`}>
      <div className={styles.cardHeader} onClick={() => setExpanded((v) => !v)}>
        <div className={styles.cardMeta}>
          <h3 className={styles.cardTitle}>{meal.title || "Untitled Meal"}</h3>
          {meal.description && (
            <p className={styles.cardDesc}>{meal.description}</p>
          )}
        </div>

        <div className={styles.cardActions}>
          {/* Favorite button */}
          <button
            className={`${styles.heartBtn} ${meal.isFavorite ? styles.heartActive : ""} ${favoriting ? styles.heartBusy : ""}`}
            onClick={handleFavorite}
            aria-label={meal.isFavorite ? "Remove from favorites" : "Add to favorites"}
            title={meal.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <HeartIcon filled={meal.isFavorite} />
          </button>

          <div className={styles.cardToggle}>
            <span className={styles.ingredientCount}>
              {meal.ingredients?.length ?? 0} ingredients
            </span>
            <ChevronIcon open={expanded} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className={styles.cardBody}>
          {meal.ingredients?.length > 0 && (
            <section className={styles.section}>
              <h4 className={styles.sectionLabel}>Ingredients</h4>
              <ul className={styles.ingredientList}>
                {meal.ingredients.map((ing, i) => (
                  <li key={i} className={styles.ingredientItem}>
                    <span className={styles.dot} />
                    {ing}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {meal.instructions?.length > 0 && (
            <section className={styles.section}>
              <h4 className={styles.sectionLabel}>Instructions</h4>
              <ol className={styles.instructionList}>
                {meal.instructions.map((step, i) => (
                  <li key={i} className={styles.instructionItem}>
                    <span className={styles.stepNum}>{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function MealSearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "favorites"
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchMeals = useCallback(async (q, f) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (f === "favorites") params.set("favorites", "true");
      const res = await fetch(`/api/meals/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch meals");
      const data = await res.json();
      setMeals(data.meals ?? data);
      setTotal(data.total ?? (data.meals ?? data).length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMeals(query, filter);
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, filter, fetchMeals]);

  // Update a single meal's isFavorite in local state — no refetch needed
  function handleFavoriteToggle(mealId, isFavorite) {
    setMeals((prev) =>
      prev
        .map((m) => (m.id === mealId ? { ...m, isFavorite } : m))
        // If we're in the favorites filter and we just un-favorited, remove it
        .filter((m) => filter !== "favorites" || m.isFavorite)
    );
    setTotal((prev) =>
      filter === "favorites" && !isFavorite ? (prev ?? 1) - 1 : prev
    );
  }

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.wordmark}>
            <span className={styles.wordmarkIcon}>⊕</span>
            meal<strong>search</strong>
          </div>
          <p className={styles.subtitle}>find anything in your recipe collection</p>
        </div>
      </header>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}><SearchIcon /></span>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search by title, ingredient, or keyword…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className={styles.clearBtn} onClick={clearSearch} aria-label="Clear search">
              <CloseIcon />
            </button>
          )}
        </div>

        <div className={styles.filterRow}>
          <button
            className={`${styles.filterBtn} ${filter === "all" ? styles.filterActive : ""}`}
            onClick={() => setFilter("all")}
          >
            All meals
          </button>
          <button
            className={`${styles.filterBtn} ${filter === "favorites" ? styles.filterActive : ""}`}
            onClick={() => setFilter("favorites")}
          >
            <HeartIcon filled={filter === "favorites"} /> Favorites
          </button>

          {total !== null && !loading && (
            <span className={styles.resultCount}>
              {total} result{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <main className={styles.results}>
        {loading && (
          <div className={styles.statusBlock}>
            <div className={styles.spinner} />
            <p>Searching…</p>
          </div>
        )}

        {!loading && error && (
          <div className={`${styles.statusBlock} ${styles.errorBlock}`}>
            <p>⚠ {error}</p>
            <button className={styles.retryBtn} onClick={() => fetchMeals(query, filter)}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && meals.length === 0 && (
          <div className={styles.emptyBlock}>
            <EmptyIcon />
            <p className={styles.emptyTitle}>No meals found</p>
            <p className={styles.emptyHint}>
              {query ? `Nothing matched "${query}"` : filter === "favorites" ? "No favorites yet — tap the heart on any meal" : "Your collection is empty"}
            </p>
          </div>
        )}

        {!loading && !error && meals.length > 0 && (
          <div className={styles.cardGrid}>
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}