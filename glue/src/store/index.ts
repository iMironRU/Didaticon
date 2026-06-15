// Хранилище за фасадом — приватная сменяемая деталь (docs/glue-contracts.md §6).
// SCORM-only старт: тонкий CMI-снимок. Придёт cmi5 — подменишь на SQL LRS,
// контракты §2–§3 не меняются.
import type {
  CmiSnapshot,
  EventId,
  AttemptId,
  Svidetelstvo,
} from "@eios/contracts";
import type { Config } from "../config.js";
import { SqliteCmiStore } from "./sqlite-cmi.js";

/** Запись свидетельства в нижнем outbox = каноническое свидетельство, без внутренних флагов. */
export type SvidetelstvoRecord = Svidetelstvo;

export interface Store {
  /** Идемпотентно по (eventId, attemptId, sequence). last-write-wins на suspend_data. */
  putCmi(eventId: EventId, attemptId: AttemptId, sequence: number, cmi: CmiSnapshot): Promise<void>;
  /** Последнее синхронизированное состояние попытки (resume). */
  getCmi(eventId: EventId, attemptId: AttemptId): Promise<CmiSnapshot | null>;
  /** Очередь свидетельств в Univerkon (нижний outbox). Идемпотентно по (eventId, attemptId). */
  enqueueSvidetelstvo(rec: SvidetelstvoRecord): Promise<void>;
  takePendingSvidetelstva(limit: number): Promise<SvidetelstvoRecord[]>;
  markSvidetelstvoSent(eventId: EventId, attemptId: AttemptId): Promise<void>;
}

export function makeStore(cfg: Config): Store {
  if (cfg.store === "postgres") {
    // TODO(срез-1): PgStore (центральный узел). Та же форма CMI-снимка.
    throw new Error("PgStore not implemented yet — use sqlite for срез 1");
  }
  return new SqliteCmiStore(cfg.sqlitePath);
}
