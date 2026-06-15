// Каноническая форма свидетельства (docs/glue-contracts.md §3).
// Это запись, которая живёт в outbox клея и проводится в Univerkon методом
// deposit_svidetelstvo. Идемпотентность — по (eventId, attemptId).
import type { EventId, StudentId, AttemptId } from "./ids.js";
import type { Valence } from "./boundary.js";

/** Сырой балл прохождения. Свёртку по формуле §7.2 делает мост Univerkon. */
export interface RawScore {
  raw: number;
  min?: number;
  max?: number;
  scaled?: number; // SCORM 2004: [-1..1]
}

/** Каноническое свидетельство — рождается на границе события. */
export interface Svidetelstvo {
  eventId: EventId;
  studentId: StudentId;
  attemptId: AttemptId;
  valence: Valence;
  /** Сырой SCORM-статус для аудита (см. §8.4 — формат открыт). */
  status: string;
  score?: RawScore;
  /** ISO-8601, момент завершения у конкретного студента. */
  occurredAt: string;
}
