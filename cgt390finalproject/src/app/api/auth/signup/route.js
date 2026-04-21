
import bcrypt from "bcryptjs";
import { prisma }  from "../../../../../lib/prisma.js";
export const runtime = "nodejs";

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: "Missing email or password" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return Response.json({ error: "User already exists" }, { status: 409 });
    }
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    return Response.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return Response.json({ error: "Error creating user" }, { status: 500 });
  }
}
