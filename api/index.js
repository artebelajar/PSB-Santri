import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { admins, santri } from "../db/schema.js";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();
const JWT_ALGORITHM = "HS256";
const SECRET = process.env.JWT_SECRET || w34r3573n93r;

if (!process.env.JWT_SECRET) {
  console.warn("⚠️  PERINGATAN: JWT_SECRET tidak diset di .env! Gunakan default value (tidak aman untuk production)");
}
if (!process.env.RECAPTCHA_SECRET) {
  console.warn("⚠️  PERINGATAN: RECAPTCHA_SECRET tidak diset di .env! Fitur captcha tidak akan berfungsi");
}

app.use("*/", serveStatic({ root: "./public" }));

app.get("/api/hello", (c) => c.json({ message: "API PSB Aktif!" }));

app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Terjadi kesalahan pada server" }, 500);
});

app.post("/api/submit", async (c) => {
  try {
    const body = await c.req.parseBody();
    const schema = z.object({
      name: z.string().min(3, "minimal 3 karakter"),
      gender: z.enum(["Ikhwan", "Akhwat"], {
        errorMap: () => ({ message: "Pilih gender yang valid" }),
      }),
      hafalan: z.coerce.number().min(0, "hafalan tidak boleh minus"),
      wali: z.string().min(3, "nama wali wajib diisi"),
      "g-recaptha-response": z
        .string()
        .min(1, "centang Captcha terlebih dahulu!"),
    });

    const parse = schema.safeParse(body);
    if (!parse.success)
      return c.json({ error: parse.error.errors[0].message }, 400);

    const formData = new URLSearchParams();
    formData.append("secret", process.env.RECAPTCHA_SECRET);
    formData.append("response", parse.data["g-recaptha-response"]);

    const verify = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const captchaRes = await verify.json();
    if (!captchaRes.success) {
      return c.json({ error: "verifikasi Captcha Gagal" }, 400);
    }

    await db.insert(santri).values({
      name: parse.data.name,
      gender: parse.data.gender,
      hafalan: parse.data.hafalan,
      wali: parse.data.wali,
    });

    return c.json({ message: "Pendaftaran Berhasil!" }, 200);
  } catch (error) {
    return c.json({ error: "terjadi kesalahan sistem" }, 500);
  }
});

app.post("/api/login", async (c) => {
  const { username, password } = await c.req.json();
  const [user] = await db
    .select()
    .from(admins)
    .where(eq(admins.username, username));

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = await sign({ user: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24}, SECRET, JWT_ALGORITHM);
    const isProd = process.env.NODE_ENV === "production";
    setCookie(c, "admin_session", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: Math.floor(Date.now() / 1000) + 60 * 60 * 24
    });

    return c.json({ message: "Login berhasil!" });
  }
  return c.json({ message: "gagal" }, 401);
});

app.get("/api/admin/santri", async (c) => {
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
});

app.get("/api/logout", (c) => {
  deleteCookie(c, "admin_session");
  return c.json({ message: "Sesi berakhir" });
});

const port = 9192;
serve({ fetch: app.fetch, port: port });
console.log(`Server berjalan di http://localhost:${port}`);
export default app;
