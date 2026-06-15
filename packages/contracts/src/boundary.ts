// Правило границы события (docs/glue-contracts.md §4).
// Клей лепит свидетельство на ТЕРМИНАЛЬНЫЙ исход. Валентность ставится
// по форме контроля узла (приходит в лонч-контексте). Закрытость и пересдачу
// считает Univerkon, не клей.

/** Чем закрывается обязательство узла. Приходит в лонч-контексте; дефолт 'pass'. */
export type ClosureSemantics = "completion" | "pass";

/** Нормализованный исход прохождения (сводится из CMI). */
export type Outcome =
  | "passed"
  | "completed"
  | "failed"
  | "incomplete"; // suspended/в процессе

export type Valence = "positive" | "negative";

/** null = граница НЕ достигнута (живое черновое, свидетельство не лепим). */
export function valenceFor(
  closure: ClosureSemantics,
  outcome: Outcome,
): Valence | null {
  if (outcome === "incomplete") return null; // §4: не терминально
  if (closure === "completion") {
    return outcome === "completed" ? "positive" : null;
  }
  // closure === "pass" (оценочный узел)
  if (outcome === "passed") return "positive";
  if (outcome === "failed") return "negative"; // §5/§11: зафиксированная попытка → пересдача
  // 'completed' без явного pass/fail на оценочном узле — открытый вопрос §8.1
  return null;
}
