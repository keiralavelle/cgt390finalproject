"use client";

export default function GroceryList() {
  const addItem = () => {
    const input = document.getElementById("grocery-input");
    const list = document.getElementById("grocery-list");

    const value = input.value.trim();
    if (!value) return;

    const li = document.createElement("li");
    li.textContent = value;

    list.appendChild(li);
    input.value = "";
  };

  return (
    <div className="page">
      <h1>Grocery List</h1>

      <div>
        <input
          id="grocery-input"
          placeholder="Add item..."
        />
        <button onClick={addItem}>Add</button>
      </div>

      <ul id="grocery-list"></ul>
    </div>
  );
}