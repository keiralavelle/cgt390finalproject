"use client";

import "./Navbar.css";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

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
              href={item.path}
              className={
                pathname === item.path
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="auth-section">
        {status === "loading" ? (
          <span>Loading...</span>
        ) : session ? (
          <>
            <span className="user-email">{session.user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="sign-out-btn"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/auth/signin" className="sign-in-link">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;