import { getCookie } from "@hono/node-server/cookie";
import { verify } from "hono/jwt";
import { db } from "../db/index.js";
import { santri } from "../db/schema.js";
import { eq } from "drizzle-orm";
import "dotenv/config";

const SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_ALGORITHM = "HS256";

export const auth = async (c) => {
  const token = getCookie(c, "admin_session");
  if (!token) return c.text("Akses di tolak", 401);
  try {
    await verify(token, SECRET, JWT_ALGORITHM);
    const data = await db.select().from(santri);
    return c.json(data);
  } catch (error) {
    console.error("Verify error:", error);
    return c.text("Sesi Habis", 401);
  }
};