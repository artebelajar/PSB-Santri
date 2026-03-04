

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