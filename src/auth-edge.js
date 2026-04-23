import NextAuth from "next-auth";

export const { auth } = NextAuth({
  providers: [],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!(auth && auth.user);

      if (nextUrl.pathname.startsWith("/auth")) return true;

      return isLoggedIn; // false = redirect to /auth/signin, true = allow through
    },
  },
});