// Каноническая форма свидетельства (docs/glue-contracts.md §3).
// Это запись, которая живёт в outbox клея и проводится в Univerkon методом
// deposit_svidetelstvo. Идемпотентность — по (eventId, attemptId).
import type { EventId, StudentId, AttemptId } from "./ids.js";
import type { Valence, Outcome } from "./boundary.js";

/** Сырой балл прохождения. Свёртку по формуле §7.2 делает мост Univerkon. */
export interface RawScore {
  raw: number;
  min?: number;
  max?: number;
  scaled?: number; // SCORM 2004: [-1..1]
}

/**
 * Сырые SCORM-статусы для аудита (§8.4 закрыт вариантом C: status + rawStatus).
 * Нормализованный исход живёт в Svidetelstvo.status; сырьё — здесь, чтобы
 * валидатор/комиссия видели полную картину (browsed, not attempted, unknown).
 */
export interface RawStatus {
  scormVersion: "1.2" | "2004";
  /** SCORM 1.2: cmi.core.lesson_status — passed|completed|failed|incomplete|browsed|not attempted. */
  lessonStatus?: string;
  /** SCORM 2004: cmi.completion_status — completed|incomplete|not attempted|unknown. */
  completionStatus?: string;
  /** SCORM 2004: cmi.success_status — passed|failed|unknown. */
  successStatus?: string;
}

/** Каноническое свидетельство — рождается на границе события. */
export interface Svidetelstvo {
  eventId: EventId;
  studentId: StudentId;
  attemptId: AttemptId;
  valence: Valence;
  /** Нормализованный исход — для машинной обработки в Univerkon. */
  status: Outcome;
  /** Сырые SCORM-статусы — для аудита (§8.4). */
  rawStatus: RawStatus;
  score?: RawScore;
  /** ISO-8601, момент завершения у конкретного студента. */
  occurredAt: string;
}
