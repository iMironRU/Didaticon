// Лепка свидетельства на границе события и постановка в нижний outbox.
// docs/glue-contracts.md §3, §4.
import type { ClosureSemantics } from "@eios/contracts";
import type { Store } from "./store/index.js";
import { decide } from "./boundary.js";

export async function maybeFormSvidetelstvo(args: {
  store: Store;
  eventId: string;
  studentId: string;
  attemptId: string;
  closure: ClosureSemantics;
  cmi: Record<string, unknown>;
}): Promise<{ formed: boolean }> {
  const { store, eventId, studentId, attemptId, closure, cmi } = args;
  const { outcome, valence } = decide(closure, cmi);
  if (valence === null) return { formed: false }; // граница не достигнута

  await store.enqueueSvidetelstvo({
    eventId,
    studentId,
    attemptId,
    valence,
    status: outcome,
    score: typeof cmi["cmi.core.score.raw"] === "number"
      ? (cmi["cmi.core.score.raw"] as number)
      : undefined,
    occurredAt: new Date().toISOString(),
  });
  // Идемпотентность по (eventId, attemptId) — внутри enqueue.
  return { formed: true };
}
