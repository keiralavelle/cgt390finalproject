import React from "react";

import "./favorites.css";

const Favorites = () => {
  const favorites = ["Spaghetti", "Chicken Alfredo", "Tacos"];

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        <div className="favorites-header">
          <h1 className="favorites-title">Favorites</h1>
        </div>

        <ul className="favorites-list">
          {favorites.map((meal, index) => (
            <li key={index} className="favorites-item">
              {meal}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Favorites;