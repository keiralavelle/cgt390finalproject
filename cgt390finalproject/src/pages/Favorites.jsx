import React from "react";

const Favorites = () => {
  const favorites = ["Spaghetti", "Chicken Alfredo", "Tacos"];

  return (
    <div className="page">
      <h1>Favorites</h1>
      <ul>
        {favorites.map((meal, index) => (
          <li key={index}>{meal}</li>
        ))}
      </ul>
    </div>
  );
};

export default Favorites;