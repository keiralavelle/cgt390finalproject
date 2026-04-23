"use client";

import "./Navbar.css";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import logo from "../../assets/fork.png";

const Navbar = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navItems = [
    { name: "Home",         path: "/" },
    { name: "Grocery List", path: "/grocery" },
    { name: "Favorites",    path: "/favorites" },
    { name: "Search",       path: "/search" },
    { name: "Add Meal",     path: "/add-meal" },
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
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

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
    </nav>
  );
};

export default Navbar;