import React, { useState } from "react";
import "./AddMeal.css";

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
    <div className="add-meal-page">
      <div className="add-meal-container">
        <div className="add-meal-header">
          <h1 className="add-meal-title">Add Meal</h1>
          <p className="add-meal-subtitle">Save a meal with ingredients and instructions.</p>
        </div>

        <div className="add-meal-form">
          <div className="add-meal-field">
            <label className="add-meal-label">Meal Name</label>
            <input
              className="add-meal-input"
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              placeholder="Enter meal name..."
            />
          </div>

          <div className="add-meal-field">
            <label className="add-meal-label">Description</label>
            <textarea
              className="add-meal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write description here..."
            />
          </div>

          <div className="add-meal-field">
            <label className="add-meal-label">Ingredients</label>
            <textarea
              className="add-meal-textarea"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="One ingredient per line"
            />
            <div className="add-meal-helper">Put each ingredient on its own line.</div>
          </div>

          <div className="add-meal-field">
            <label className="add-meal-label">Instructions</label>
            <textarea
              className="add-meal-textarea"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="One step per line"
            />
            <div className="add-meal-helper">Put each instruction step on its own line.</div>
          </div>

          <div className="add-meal-actions">
            <button className="add-meal-button add-meal-button-primary" onClick={handleSubmit}>
              Add Meal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMeal;