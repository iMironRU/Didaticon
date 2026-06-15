// Применение правила границы (docs/glue-contracts.md §4).
// Сведение сырого CMI в нормализованный Outcome + валентность по форме контроля.
import {
  valenceFor,
  type ClosureSemantics,
  type Outcome,
  type CmiSnapshot,
  type BoundaryDecision,
} from "@eios/contracts";

/** Свести CMI к нормализованному исходу (SCORM 1.2 / 2004). */
export function outcomeFromCmi(cmi: CmiSnapshot): Outcome {
  // SCORM 1.2: cmi.core.lesson_status; SCORM 2004: completion_status + success_status.
  // TODO(срез-1): полный маппинг статусов (см. §8.2 открытых вопросов).
  const status =
    (cmi["cmi.core.lesson_status"] as string) ??
    (cmi["cmi.completion_status"] as string) ??
    "incomplete";
  if (status === "passed") return "passed";
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  return "incomplete";
}

export function decide(closure: ClosureSemantics, cmi: CmiSnapshot): BoundaryDecision {
  const outcome = outcomeFromCmi(cmi);
  return { outcome, valence: valenceFor(closure, outcome) };
}
