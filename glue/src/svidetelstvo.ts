// Лепка свидетельства на границе события и постановка в нижний outbox.
// docs/glue-contracts.md §3, §4.
import type {
  ClosureSemantics,
  CmiSnapshot,
  EventId,
  StudentId,
  AttemptId,
  RawScore,
} from "@eios/contracts";
import type { Store } from "./store/index.js";
import { decide } from "./boundary.js";

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
  cmi: CmiSnapshot;
}): Promise<{ formed: boolean }> {
  const { store, eventId, studentId, attemptId, closure, cmi } = args;
  const { outcome, valence } = decide(closure, cmi);
  if (valence === null) return { formed: false }; // граница не достигнута

  await store.enqueueSvidetelstvo({
    eventId,
    studentId,
    attemptId,
    valence,
    status: outcome, // TODO(§8.4): хранить сырой CMI-статус, не нормализованный
    score: extractScore(cmi),
    occurredAt: new Date().toISOString(),
  });
  // Идемпотентность по (eventId, attemptId) — внутри enqueue.
  return { formed: true };
}
