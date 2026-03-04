import { Hono } from "hono";
import { z } from "zod";
import { db } from "./db/index.js";
import { admins, santri } from "./schema.js";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import "dotenv/config";

const JWT_ALGORITHM = "HS256";
const SECRET = process.env.JWT_SECRET || w34r3573n93r;

if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️  PERINGATAN: JWT_SECRET tidak diset di .env! Gunakan default value (tidak aman untuk production)",
  );
}

export const login = async (c) => {
  try {
    const { username, password } = await c.req.json();

    const [user] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username));

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = await sign(
        {
          user: user.username,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        SECRET,
        JWT_ALGORITHM,
      );

      const isProd = process.env.NODE_ENV === "production";

      setCookie(c, "admin_session", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });

      return c.json({ message: "Login berhasil!" });
    }

    return c.json({ message: "Username atau password salah" }, 401);
  } catch (error) {
    console.error("Login Error:", error);
    return c.json({ error: "Format data salah atau gangguan server" }, 400);
  }
};
