import { Hono } from "hono";
import { z } from "zod";
import { db } from "./db/index.js";
import { admins, santri } from "./db/schema.js";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

//folder api
import { submit } from "./api/submit.js";
import { login } from "./api/login.js";
import { auth } from "./api/auth.js";
import { logout } from "./api/logout.js";

const app = new Hono();
const JWT_ALGORITHM = "HS256";
const SECRET = process.env.JWT_SECRET || w34r3573n93r;

if (!process.env.JWT_SECRET) {
  console.warn("⚠️  PERINGATAN: JWT_SECRET tidak diset di .env! Gunakan default value (tidak aman untuk production)");
}
if (!process.env.RECAPTCHA_SECRET) {
  console.warn("⚠️  PERINGATAN: RECAPTCHA_SECRET tidak diset di .env! Fitur captcha tidak akan berfungsi");
}

app.use("/*", serveStatic({ root: "./public" }));

app.get("/api/hello", (c) => c.json({ message: "API PSB Aktif!" }));

app.post("/api/submit", submit);

app.post("/api/login", login);

app.get("/api/admin/santri", auth);

app.get("/api/logout", logout);

app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Terjadi kesalahan pada server" }, 500);
});

const port = 8912;
serve({ fetch: app.fetch, port: port });
console.log(`Server berjalan di http://localhost:${port}`);
export default app;
