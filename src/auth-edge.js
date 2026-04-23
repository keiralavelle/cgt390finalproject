// src/auth-edge.js  (also copy to root auth-edge.js — both are used)
//
// Edge-compatible NextAuth config used by middleware.js.
// Full auth config (with DB + bcrypt) lives in src/auth.js —
// that can't run on the edge, so we keep this lightweight copy.

import NextAuth from "next-auth";

export const { auth } = NextAuth({
  providers: [],   // providers only needed in the full auth.js
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!(auth && auth.user);

      // Always allow the sign-in / register pages through
      if (nextUrl.pathname.startsWith("/auth")) return true;

      // Everything else requires a session
      if (!isLoggedIn) {
        return Response.redirect(new URL("/auth/signin", nextUrl));
      }

      return true;
    },
  },
});