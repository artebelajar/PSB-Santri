import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { admins, santri } from "../db/schema.js";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import "dotenv/config";

export const submit = async (c) => {
  try {
    const body = await c.req.parseBody();
    const schema = z.object({
      name: z.string().min(3, "minimal 3 karakter"),
      gender: z.enum(["ikhwan", "akhwat"], {
        errorMap: () => ({ message: "Pilih gender yang valid" }),
      }),
      hafalan: z.coerce.number().min(0, "hafalan tidak boleh minus"),
      wali: z.string().min(3, "nama wali wajib diisi"),
      "g-recaptcha-response": z
        .string()
        .min(1, "centang Captcha terlebih dahulu!"),
    });

    const parse = schema.safeParse(body);
    if (!parse.success) {
      const errorMessage = parse.error.issues[0]?.message || "Validasi gagal";
      return c.json({ error: errorMessage }, 400);
    }
    
    const formData = new URLSearchParams();
    formData.append("secret", process.env.RECAPTCHA_SECRET);
    formData.append("response", parse.data["g-recaptcha-response"]);

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
    console.error("Detail error:", error);
    return c.json(
      { error: error.message || "terjadi kesalahan sistem di submit" },
      500,
    );
  }
};
