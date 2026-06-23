// Тонкий CMI-снимок на (eventId, attemptId). Без трансляции в xAPI (SCORM-only).
// docs/glue-contracts.md §6: форма хранения — приватная деталь за фасадом.
// better-sqlite3 синхронен → все методы Store оборачиваем в Promise.resolve(),
// но реальных await внутри нет — не блокируем event loop на долго.
import { createRequire } from "module";
import type BetterSqlite3Type from "better-sqlite3";
import type { CmiSnapshot, EventId, AttemptId } from "@eios/contracts";
import type { Store, SvidetelstvoRecord } from "./index.js";

// ESM-обёртка: better-sqlite3 — CJS-пакет.
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const BetterSqlite3 = require("better-sqlite3") as typeof BetterSqlite3Type;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS cmi (
  event_id   TEXT NOT NULL,
  attempt_id TEXT NOT NULL,
  sequence   INTEGER NOT NULL,
  snapshot   TEXT NOT NULL,           -- JSON CMI-снимка
  saved_at   TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, attempt_id, sequence)
) STRICT;

CREATE TABLE IF NOT EXISTS svidetelstvo_outbox (
  event_id    TEXT NOT NULL,
  attempt_id  TEXT NOT NULL,
  payload     TEXT NOT NULL,          -- JSON Svidetelstvo
  sent        INTEGER NOT NULL DEFAULT 0,
  enqueued_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, attempt_id)  -- одно свидетельство на попытку
) STRICT;
`;

export class SqliteCmiStore implements Store {
  private db: BetterSqlite3Type.Database;

  constructor(path: string) {
    this.db = new BetterSqlite3(path);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(SCHEMA);
  }

  async putCmi(
    eventId: EventId,
    attemptId: AttemptId,
    sequence: number,
    cmi: CmiSnapshot,
  ): Promise<void> {
    // INSERT OR IGNORE: идемпотентно по (eventId, attemptId, sequence);
    // last-write-wins на suspend_data реализован через sequence — клиент
    // всегда шлёт следующий порядковый, старые ключи не перетираются.
    this.db
      .prepare(
        `INSERT OR IGNORE INTO cmi (event_id, attempt_id, sequence, snapshot)
         VALUES (?, ?, ?, ?)`,
      )
      .run(eventId, attemptId, sequence, JSON.stringify(cmi));
    return Promise.resolve();
  }

  async getCmi(eventId: EventId, attemptId: AttemptId): Promise<CmiSnapshot | null> {
    // Последний коммит по sequence = последнее состояние попытки (resume).
    const row = this.db
      .prepare(
        `SELECT snapshot FROM cmi
         WHERE event_id = ? AND attempt_id = ?
         ORDER BY sequence DESC LIMIT 1`,
      )
      .get(eventId, attemptId) as { snapshot: string } | undefined;
    return Promise.resolve(row ? (JSON.parse(row.snapshot) as CmiSnapshot) : null);
  }

  async enqueueSvidetelstvo(rec: SvidetelstvoRecord): Promise<void> {
    // INSERT OR IGNORE: одно свидетельство на (eventId, attemptId) — идемпотентно.
    this.db
      .prepare(
        `INSERT OR IGNORE INTO svidetelstvo_outbox (event_id, attempt_id, payload)
         VALUES (?, ?, ?)`,
      )
      .run(rec.eventId, rec.attemptId, JSON.stringify(rec));
    return Promise.resolve();
  }

  async takePendingSvidetelstva(limit: number): Promise<SvidetelstvoRecord[]> {
    const rows = this.db
      .prepare(
        `SELECT payload FROM svidetelstvo_outbox
         WHERE sent = 0
         ORDER BY enqueued_at
         LIMIT ?`,
      )
      .all(limit) as { payload: string }[];
    return Promise.resolve(rows.map((r) => JSON.parse(r.payload) as SvidetelstvoRecord));
  }

  async markSvidetelstvoSent(eventId: EventId, attemptId: AttemptId): Promise<void> {
    this.db
      .prepare(
        `UPDATE svidetelstvo_outbox SET sent = 1
         WHERE event_id = ? AND attempt_id = ?`,
      )
      .run(eventId, attemptId);
    return Promise.resolve();
  }
}
