import React, { useState } from "react";

const Search = () => {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    console.log("Searching for:", query);
  };

  return (
    <div className="page">
      <h1>Search Meals</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search meals..."
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default Search;