// Контракт PWA ↔ клей (docs/glue-contracts.md §2).
import type { EventId, StudentId, AttemptId, DidacticUnitId } from "./ids.js";
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
  eventId: EventId;
  attemptId: AttemptId;
  closure: ClosureSemantics;
  scormVersion: "1.2" | "2004";
  packageUrl: string;
}

/** PWA: положить порцию CMI. Идемпотентность по (eventId, attemptId, sequence). */
export interface CommitRequest {
  eventId: EventId;
  attemptId: AttemptId;
  sequence: number;       // монотонный счётчик коммита в попытке
  cmi: CmiSnapshot;
  closure: ClosureSemantics;   // из лонч-контекста, §8.3
  scormVersion: "1.2" | "2004"; // нужно клею для парсинга rawStatus, §8.4
  outcome?: Outcome;            // нормализованный исход, если сводится клиентом
  credential: Credential;
}

export interface CommitResponse {
  accepted: boolean;
}

/** PWA: получить последнее СИНХРОНИЗИРОВАННОЕ состояние попытки для resume. */
export interface ResumeRequest {
  eventId: EventId;
  attemptId: AttemptId;
  credential: Credential;
}

export interface ResumeResponse {
  cmi: CmiSnapshot | null; // null = нет синхронизированного состояния
}

// --- Проекция траектории (§4 концепции, шаг 4 плана) ------------------------

/** Узел дидактической единицы в проекции студента. */
export interface TrajectoryNode {
  unitId: DidacticUnitId;
  eventId: EventId;
  title: string;
  closure: ClosureSemantics;
  scormVersion: "1.2" | "2004";
  packageUrl: string;
  /** Сводка из Univerkon: текущее состояние обязательства студента. */
  state: "open" | "in_progress" | "closed_positive" | "closed_negative";
}

/** Проекция дисциплины: список узлов + метка времени проекции. */
export interface TrajectoryProjection {
  studentId: StudentId;
  disciplineTitle: string;
  nodes: TrajectoryNode[];
  projectedAt: string; // ISO-8601
}
