// Применение правила границы (docs/glue-contracts.md §4, §8.1-§8.2).
// Сведение сырого CMI в нормализованный Outcome + валентность по форме контроля.
import {
  valenceFor,
  type ClosureSemantics,
  type Outcome,
  type CmiSnapshot,
  type BoundaryDecision,
} from "@eios/contracts";

// --- SCORM 1.2 ---------------------------------------------------------------
// cmi.core.lesson_status: passed | failed | completed | incomplete | browsed | not attempted
// browsed / not attempted — студент открыл курс, но до ничего не дошёл; не терминально.
function mapScorm12(lessonStatus: string): Outcome {
  switch (lessonStatus) {
    case "passed":        return "passed";
    case "failed":        return "failed";
    case "completed":     return "completed";
    case "incomplete":    return "incomplete";
    case "browsed":       return "incomplete"; // §8.2: не терминально
    case "not attempted": return "incomplete"; // §8.2: не терминально
    default:              return "incomplete";
  }
}

// --- SCORM 2004 --------------------------------------------------------------
// Две оси: completion_status (completed|incomplete|not attempted|unknown)
//          success_status    (passed|failed|unknown)
//
// Приоритет success_status, когда он определён (passed/failed):
//   success=passed  → passed   (даже если completion≠completed)
//   success=failed  → failed
//
// §8.1: completion=completed + success=unknown
//   → outcome = "completed"
//   Следствие для валентности:
//     closure=completion → positive (закрывает, §4)
//     closure=pass       → null (не терминально — явный pass не получен)
//   Это безопасный дефолт: студент не застрянет, но и оценочный узел
//   не закроется положительно без явного passed.
//
// Всё остальное (incomplete, not attempted, unknown completion) → incomplete.
function mapScorm2004(completionStatus: string, successStatus: string): Outcome {
  if (successStatus === "passed")  return "passed";
  if (successStatus === "failed")  return "failed";
  if (completionStatus === "completed") return "completed"; // §8.1
  return "incomplete";
}

// --- Публичный API -----------------------------------------------------------

/** Свести CMI к нормализованному исходу (SCORM 1.2 / 2004). */
export function outcomeFromCmi(cmi: CmiSnapshot): Outcome {
  const lessonStatus = cmi["cmi.core.lesson_status"];
  if (typeof lessonStatus === "string") {
    return mapScorm12(lessonStatus);
  }

  // SCORM 2004: читаем обе оси; отсутствие ключа = "unknown" / "incomplete"
  const completion = typeof cmi["cmi.completion_status"] === "string"
    ? (cmi["cmi.completion_status"] as string)
    : "unknown";
  const success = typeof cmi["cmi.success_status"] === "string"
    ? (cmi["cmi.success_status"] as string)
    : "unknown";

  return mapScorm2004(completion, success);
}

export function decide(closure: ClosureSemantics, cmi: CmiSnapshot): BoundaryDecision {
  const outcome = outcomeFromCmi(cmi);
  return { outcome, valence: valenceFor(closure, outcome) };
}
