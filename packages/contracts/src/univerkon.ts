// Контракт клей → Univerkon (docs/glue-contracts.md §3).
// Единственный метод. Транспорт — JSON-RPC + JWT (паттерн КандиМил).
import type { Valence } from "./boundary.js";

export interface DepositSvidetelstvo {
  eventId: string;
  studentId: string;
  attemptId: string;
  valence: Valence;
  status: string;        // исходный SCORM-статус (аудит)
  score?: number;        // сырой балл; свёртку по формуле §7.2 делает мост Univerkon
  occurredAt: string;    // ISO-8601, момент завершения у студента
}

export interface DepositResult {
  /** Идемпотентность: одно свидетельство на (eventId, attemptId). */
  deduplicated: boolean;
}
