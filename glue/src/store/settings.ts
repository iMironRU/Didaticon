import { createRequire } from "module";
import type BetterSqlite3Type from "better-sqlite3";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BetterSqlite3 = require("better-sqlite3") as typeof BetterSqlite3Type;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;
`;

export class SettingsStore {
  private db: BetterSqlite3Type.Database;

  constructor(path: string) {
    this.db = new BetterSqlite3(path);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(SCHEMA);
  }

  get(key: string): string | null {
    const row = this.db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  set(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value,
           updated_at = datetime('now')`,
      )
      .run(key, value);
  }

  delete(key: string): void {
    this.db.prepare("DELETE FROM settings WHERE key = ?").run(key);
  }

  getAll(): Record<string, string> {
    const rows = this.db
      .prepare("SELECT key, value FROM settings")
      .all() as { key: string; value: string }[];
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
}
