"use client";

import { useState, useEffect } from "react";
import "./favorites.css";

const HeartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/meals/search?favorites=true");
        if (!res.ok) throw new Error("Failed to load favorites");
        const data = await res.json();
        setFavorites(data.meals ?? data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUnfavorite(meal) {
    setRemoving(meal.id);
    try {
      const res = await fetch(`/api/meals/${meal.id}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: false }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setFavorites((prev) => prev.filter((m) => m.id !== meal.id));
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        <div className="favorites-header">
          <h1 className="favorites-title">Favorites</h1>
          {!loading && !error && (
            <span className="favorites-count">{favorites.length} saved</span>
          )}
        </div>

        {loading && <p className="favorites-status">Loading…</p>}
        {error && <p className="favorites-status favorites-error">⚠ {error}</p>}

        {!loading && !error && favorites.length === 0 && (
          <div className="favorites-empty">
            <p>No favorites yet.</p>
            <p>Tap the heart on any meal in Search to save it here.</p>
          </div>
        )}

        {!loading && !error && favorites.length > 0 && (
          <ul className="favorites-list">
            {favorites.map((meal) => (
              <li key={meal.id} className="favorites-item">
                <div className="favorites-item-info">
                  <span className="favorites-item-title">{meal.title}</span>
                  {meal.description && (
                    <span className="favorites-item-desc">{meal.description}</span>
                  )}
                </div>
                <button
                  className={`favorites-unfav-btn ${removing === meal.id ? "favorites-unfav-busy" : ""}`}
                  onClick={() => handleUnfavorite(meal)}
                  aria-label={`Remove ${meal.title} from favorites`}
                  title="Remove from favorites"
                >
                  <HeartIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}