import React, { useState } from "react";

const AddMeal = () => {
  const [meal, setMeal] = useState("");

  const handleSubmit = () => {
    if (meal.trim()) {
      console.log("New meal added:", meal);
      setMeal("");
    }
  };

  return (
    <div className="page">
      <h1>Add Meal</h1>

      <input
        value={meal}
        onChange={(e) => setMeal(e.target.value)}
        placeholder="Enter meal name..."
      />
      <button onClick={handleSubmit}>Add</button>
    </div>
  );
};

export default AddMeal;