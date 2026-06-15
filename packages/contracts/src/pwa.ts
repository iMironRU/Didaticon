// Контракт PWA ↔ клей (docs/glue-contracts.md §2).
import type { Outcome } from "./boundary.js";

export interface Credential {
  kind: "oidc" | "mtls";   // токен PWA или серт станции (локальная зона)
  value: string;
}

/** PWA: положить порцию CMI. Идемпотентность по (eventId, attemptId, sequence). */
export interface CommitRequest {
  eventId: string;        // учебное событие из лонч-контекста
  attemptId: string;      // присвоен при запуске
  sequence: number;       // монотонный счётчик коммита в попытке
  cmi: Record<string, unknown>;
  outcome?: Outcome;      // нормализованный исход, если сводится клиентом
  credential: Credential;
}

export interface CommitResponse {
  accepted: boolean;
}

/** PWA: получить последнее СИНХРОНИЗИРОВАННОЕ состояние попытки для resume. */
export interface ResumeRequest {
  eventId: string;
  attemptId: string;
  credential: Credential;
}

export interface ResumeResponse {
  cmi: Record<string, unknown> | null; // null = нет синхронизированного состояния
}
