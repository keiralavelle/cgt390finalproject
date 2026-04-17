import { prisma } from "../lib/prisma.js";
import {
  comparePassword,
  createSession,
  buildSessionCookie,
} from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await comparePassword(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const session = await createSession(user.id);

    res.setHeader("Set-Cookie", buildSessionCookie(session.token));

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("signin error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}