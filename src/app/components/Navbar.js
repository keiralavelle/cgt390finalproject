"use client";

import "./Navbar.css";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import logo from "../../assets/fork.png";
import home from "../../assets/home.png";
import search from "../../assets/search.png";
import meal from "../../assets/add-meal.png";
import grocery from "../../assets/grocery.png";

const Navbar = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: "Home",         path: "/", icon: home, width: 22, height: 22 },
    { name: "Grocery List", path: "/grocery", icon: grocery, width: 40, height: 40 },
    { name: "Search",       path: "/search", icon: search, width: 35, height: 30 },
    { name: "Add Meal",     path: "/add-meal", icon: meal, width: 40, height: 40 },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Image src={logo} alt="Logo" width={50} height={50} />
        <div className="navbar-logo">PantryPal</div>
      </div>

      <ul className="navbar-links">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.path}
              className={pathname === item.path ? "nav-link active" : "nav-link"}
            >
              <div className="icon-wrapper">
                <Image
                  src={item.icon}
                  alt={item.name}
                  width={item.width}
                  height={item.height}
                />
              </div>    
              <span className="nav-tooltip">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      <div className="auth-section">
        {status === "loading" ? (
          <span className="auth-loading">Loading…</span>
        ) : session ? (
          <>
            {/* Clicking the email goes to the account page */}
            <Link href="/account" className="user-email" title="Edit account">
              {session.user.email}
            </Link>
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
      {menuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={pathname === item.path ? "mobile-link active" : "mobile-link"}
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;