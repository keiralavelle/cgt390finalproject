import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
    const location = useLocation();

    const navItems = [
        { name: "Home", path: "/" },
        { name: "Grocery List", path: "/grocery" },
        { name: "Favorites", path: "/favorites" },
        { name: "Search", path: "/search" },
        { name: "Add Meal", path: "/add-meal" },
        { name: "Account", path: "/account" },

    ];

    return (
        <nav className="navbar">
            <div className="navbar-logo">MealPlanner</div>

            <ul className="navbar-links">
                {navItems.map((item) => (
                    <li key={item.name}>
                        <Link
                            to={item.path}
                            className={
                                location.pathname === item.path
                                    ? "nav-link active"
                                    : "nav-link"
                            }
                        >
                            {item.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;