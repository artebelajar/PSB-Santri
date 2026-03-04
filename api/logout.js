import { deleteCookie } from "@hono/node-server/cookie";

export const logout = (c) => {
  deleteCookie(c, "admin_session");
  return c.json({ message: "Sesi berakhir" });
};
