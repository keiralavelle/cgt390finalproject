"use client";

import "./addMeal.css";

export default function AddMeal() {
  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const errorBox = document.getElementById("add-meal-error");
    const successBox = document.getElementById("add-meal-success");
    const submitButton = document.getElementById("add-meal-submit");

    errorBox.textContent = "";
    successBox.textContent = "";

    const meal = (formData.get("meal") || "").toString().trim();
    const description = (formData.get("description") || "").toString().trim();
    const ingredients = (formData.get("ingredients") || "").toString();
    const instructions = (formData.get("instructions") || "").toString();

    if (!meal) {
      errorBox.textContent = "Meal name is required.";
      return;
    }

    const newMeal = {
      title: meal,
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

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Adding...";

      const res = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMeal),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create meal");
      }

      successBox.textContent = "Meal added successfully!";
      form.reset();
    } catch (err) {
      console.error(err);
      errorBox.textContent = err.message || "Something went wrong";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Add Meal";
    }
  };

  return (
    <div className="add-meal-page">
      <div className="add-meal-container">
        <div className="add-meal-header">
          <h1 className="add-meal-title">Add Meal</h1>
          <p className="add-meal-subtitle">
            Save a meal with ingredients and instructions.
          </p>
        </div>

        <div id="add-meal-error" className="add-meal-error"></div>
        <div id="add-meal-success" className="add-meal-success"></div>

        <form className="add-meal-form" onSubmit={handleSubmit}>
          <div className="add-meal-field">
            <label className="add-meal-label" htmlFor="meal">
              Meal Name
            </label>
            <input
              id="meal"
              name="meal"
              className="add-meal-input"
              defaultValue=""
              placeholder="Enter meal name..."
            />
          </div>

          <div className="add-meal-field">
            <label className="add-meal-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="add-meal-textarea"
              defaultValue=""
              placeholder="Write description here..."
            />
          </div>

          <div className="add-meal-field">
            <label className="add-meal-label" htmlFor="ingredients">
              Ingredients
            </label>
            <textarea
              id="ingredients"
              name="ingredients"
              className="add-meal-textarea"
              defaultValue=""
              placeholder="One ingredient per line"
            />
            <div className="add-meal-helper">
              Put each ingredient on its own line.
            </div>
          </div>

          <div className="add-meal-field">
            <label className="add-meal-label" htmlFor="instructions">
              Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              className="add-meal-textarea"
              defaultValue=""
              placeholder="One step per line"
            />
            <div className="add-meal-helper">
              Put each instruction step on its own line.
            </div>
          </div>

          <div className="add-meal-actions">
            <button
              id="add-meal-submit"
              type="submit"
              className="add-meal-btn add-meal-btn--primary"
            >
              Add Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}