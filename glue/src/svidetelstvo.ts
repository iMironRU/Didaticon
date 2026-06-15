// Лепка свидетельства на границе события и постановка в нижний outbox.
// docs/glue-contracts.md §3, §4, §8.4 (status + rawStatus, вариант C).
import type {
  ClosureSemantics,
  CmiSnapshot,
  EventId,
  StudentId,
  AttemptId,
  RawScore,
  RawStatus,
} from "@eios/contracts";
import type { Store } from "./store/index.js";
import { decide } from "./boundary.js";

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function extractRawStatus(cmi: CmiSnapshot, scormVersion: "1.2" | "2004"): RawStatus {
  if (scormVersion === "1.2") {
    return {
      scormVersion: "1.2",
      lessonStatus: str(cmi["cmi.core.lesson_status"]),
    };
  }
  return {
    scormVersion: "2004",
    completionStatus: str(cmi["cmi.completion_status"]),
    successStatus: str(cmi["cmi.success_status"]),
  };
}

function extractScore(cmi: CmiSnapshot): RawScore | undefined {
  const raw =
    (cmi["cmi.core.score.raw"] as number | undefined) ??  // SCORM 1.2
    (cmi["cmi.score.raw"] as number | undefined);          // SCORM 2004
  if (typeof raw !== "number") return undefined;
  const min = cmi["cmi.core.score.min"] ?? cmi["cmi.score.min"];
  const max = cmi["cmi.core.score.max"] ?? cmi["cmi.score.max"];
  const scaled = cmi["cmi.score.scaled"];
  return {
    raw,
    ...(typeof min === "number" ? { min } : {}),
    ...(typeof max === "number" ? { max } : {}),
    ...(typeof scaled === "number" ? { scaled } : {}),
  };
}

export async function maybeFormSvidetelstvo(args: {
  store: Store;
  eventId: EventId;
  studentId: StudentId;
  attemptId: AttemptId;
  closure: ClosureSemantics;
  scormVersion: "1.2" | "2004";
  cmi: CmiSnapshot;
}): Promise<{ formed: boolean }> {
  const { store, eventId, studentId, attemptId, closure, scormVersion, cmi } = args;
  const { outcome, valence } = decide(closure, cmi);
  if (valence === null) return { formed: false }; // граница не достигнута

  await store.enqueueSvidetelstvo({
    eventId,
    studentId,
    attemptId,
    valence,
    status: outcome,
    rawStatus: extractRawStatus(cmi, scormVersion),
    score: extractScore(cmi),
    occurredAt: new Date().toISOString(),
  });
  // Идемпотентность по (eventId, attemptId) — внутри enqueue.
  return { formed: true };
}
