import {
  readSessionTokenFromCookieHeader,
  deleteSession,
  buildExpiredSessionCookie,
} from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = readSessionTokenFromCookieHeader(req.headers.cookie);
    await deleteSession(token);

    res.setHeader("Set-Cookie", buildExpiredSessionCookie());

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("signout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}