import React, { useState } from "react";

const AddMeal = () => {
  const [meal, setMeal] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  const handleSubmit = () => {
    if (meal.trim());

    const newMeal = {
      meal,
      description,
      ingredients: ingredients
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      instructions: instructions
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
  };

  console.log("New meal added:", newMeal);

  const existingMeals =
    JSON.parse(localStorage.getItem("meals")) || [];

  localStorage.setItem(
    "meals",
    JSON.stringify([...existingMeals, newMeal])
  );

  setMeal("");
  setDescription("");
  setIngredients("");
  setInstructions("");
};

  return (
    <div className="page add-meal">
      <h1>Add Meal</h1>

      <input
        value={meal}
        onChange={(e) => setMeal(e.target.value)}
        placeholder="Enter meal name..."
      />

      <label>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Write description here..."
      />

      <label>Ingredients</label>
      <textarea
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        placeholder="Write ingredients here..."
      />

      <label>Instructions</label>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Write instructions here..."
      />

      <button onClick={handleSubmit}>Add</button>
    </div>
  );
};

export default AddMeal;