"use client";

import "./grocery.css";

export default function GroceryList() {
  const addItem = () => {
    const input = document.getElementById("grocery-input");
    const list = document.getElementById("grocery-list");

    const value = input.value.trim();
    if (!value) return;

    const li = document.createElement("li");
    li.textContent = value;
    li.className = "grocery-item";

    list.appendChild(li);
    input.value = "";
  };

  return (
    <div className="grocery-page">
      <div className="grocery-container">
        <div className="grocery-header">
          <h1 className="grocery-title">Grocery List</h1>
        </div>

        <div className="grocery-input-row">
          <input
            id="grocery-input"
            className="grocery-input"
            placeholder="Add item..."
          />
          <button
            className="grocery-button"
            onClick={addItem}
          >
            Add
          </button>
        </div>

        <ul id="grocery-list" className="grocery-list"></ul>
      </div>
    </div>
  );
}