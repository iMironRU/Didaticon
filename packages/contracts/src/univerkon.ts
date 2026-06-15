// Контракт клей → Univerkon (docs/glue-contracts.md §3).
// Транспорт — JSON-RPC + JWT (паттерн КандиМил), сервисный токен клея.
// Univerkon видит только свидетельства; CMI/xAPI не протекают.
import type { Svidetelstvo } from "./svidetelstvo.js";

/** Wire-форма deposit_svidetelstvo. На уровне типов совпадает со свидетельством. */
export type DepositSvidetelstvo = Svidetelstvo;

export interface DepositResult {
  /** Идемпотентность: одно свидетельство на (eventId, attemptId). */
  deduplicated: boolean;
}
