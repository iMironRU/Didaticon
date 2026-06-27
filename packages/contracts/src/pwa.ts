// Контракт PWA ↔ клей: только SCORM-специфика (docs/glue-contracts.md §2).
// Полная иерархия траектории — в trajectory.ts, schedule.ts, gradebook.ts.
import type { EventId, StudentId, AttemptId } from "./ids.js";
import type { Outcome, ClosureSemantics } from "./boundary.js";
import type { CmiSnapshot } from "./cmi.js";

export interface Credential {
  kind: "oidc" | "mtls";   // токен PWA или серт станции (локальная зона)
  value: string;
}

/**
 * Лонч-контекст узла. PWA получает его при запуске SCORM-пакета и кладёт в
 * каждый коммит (§8.3 — место хранения closure открыто, на старте — здесь).
 */
export interface LaunchContext {
  eventId:      EventId;
  attemptId:    AttemptId;
  closure:      ClosureSemantics;
  scormVersion: "1.2" | "2004";
  packageUrl:   string;
}

/** PWA: положить порцию CMI. Идемпотентность по (eventId, attemptId, sequence). */
export interface CommitRequest {
  eventId:      EventId;
  attemptId:    AttemptId;
  sequence:     number;           // монотонный счётчик коммита в попытке
  cmi:          CmiSnapshot;
  closure:      ClosureSemantics; // из лонч-контекста, §8.3
  scormVersion: "1.2" | "2004";  // нужно клею для парсинга rawStatus, §8.4
  outcome?:     Outcome;          // нормализованный исход, если сводится клиентом
  credential:   Credential;
}

export interface CommitResponse {
  accepted: boolean;
}

/** PWA: получить последнее синхронизированное состояние попытки для resume. */
export interface ResumeRequest {
  eventId:    EventId;
  attemptId:  AttemptId;
  credential: Credential;
}

export interface ResumeResponse {
  cmi: CmiSnapshot | null; // null = нет синхронизированного состояния
}
