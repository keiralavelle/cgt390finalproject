import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import GroceryList from "./pages/GroceryList";
import Favorites from "./pages/Favorites";
import Account from "./pages/Account";
import Search from "./pages/Search";
import AddMeal from "./pages/AddMeal";
import "./App.css";

const App = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />

        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/grocery" element={<GroceryList />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/account" element={<Account />} />
            <Route path="/search" element={<Search />} />
            <Route path="/add-meal" element={<AddMeal />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;