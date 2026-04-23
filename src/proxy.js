export { auth as proxy } from "./auth-edge";

export const config = {
    matcher: [
        "/grocery",
        "/grocery/:path*",
        "/meals/search",
        "/calendar",
        "/calendar/remove",
        "/",
        "/search",
        "/search/:path*",
        "/add-meal",
        "/add-meal/:path*",
        "/favorites",
        "/favorites/:path*",
        "/account",
        "/account/:path*",
    ],
};