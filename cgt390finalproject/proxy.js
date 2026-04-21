
export { auth as proxy } from "@/auth"

//Decide which routes to run proxy.js on
export const config = {
  matcher: ["/add-profile", "/profile/:path*/edit"],
};
