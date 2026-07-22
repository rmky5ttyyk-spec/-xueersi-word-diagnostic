import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export async function getDb() {
  if (database) return database;

  const databasePath = process.env.DATABASE_PATH || "./data/diagnostics.db";
  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS diagnostics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      recent_score TEXT NOT NULL,
      score_total TEXT NOT NULL,
      learning_issue TEXT NOT NULL,
      phone TEXT NOT NULL,
      estimated_vocabulary INTEGER NOT NULL,
      accuracy_rate INTEGER NOT NULL,
      weakest_area TEXT NOT NULL,
      ability_scores TEXT NOT NULL,
      wrong_words TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'internal-test',
      follow_up_status TEXT NOT NULL DEFAULT '未跟进',
      follow_up_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS diagnostics_created_at_idx
      ON diagnostics(created_at DESC);
    CREATE INDEX IF NOT EXISTS diagnostics_phone_idx
      ON diagnostics(phone);
  `);

  database = drizzle(sqlite, { schema });
  return database;
}
