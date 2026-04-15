import React, { useState } from "react";

const GroceryList = () => {
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");

  const addItem = () => {
    if (input.trim()) {
      setItems([...items, input]);
      setInput("");
    }
  };

  return (
    <div className="page">
      <h1>Grocery List</h1>

      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add item..."
        />
        <button onClick={addItem}>Add</button>
      </div>

      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default GroceryList;