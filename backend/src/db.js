import dotenv from "dotenv";
import pg from "pg";
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(sql, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

export async function runMigrations() {
  const fs = await import("fs");
  const path = await import("path");
  const url = await import("url");
  const dir = path.resolve("migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql") || f.endsWith(".js"))
    .sort();

  for (const file of files) {
    if (file.endsWith(".sql")) {
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      console.log(`Running SQL migration: ${file}`);
      await query(sql);
    } else if (file.endsWith(".js")) {
      console.log(`Running JS migration: ${file}`);
      const migration = await import(url.pathToFileURL(path.join(dir, file)));
      if (migration.up) {
        await migration.up(pool);
      }
    }
  }
  console.log("Migrations complete");
}
