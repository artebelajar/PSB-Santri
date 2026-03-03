import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { santri, admins } from "./schema.js";
import bcrypt from "bcryptjs";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

async function main() {
  console.log("Seeding data...");
  await db.insert(santri).values({
    name: "ariska hidayat",
    gender: "Ikhwan",
    hafalan: 5,
    wali: "Bapak Hidayat",
  });
  const hashed = await bcrypt.hash("admin123", 10);
  await db.insert(admins).values({
    username: "adminPondok",
    password: hashed,
  });
  console.log("Seed seeded!");
  process.exit(0);
}
main();
