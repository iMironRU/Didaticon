import type { LessonType } from "@eios/contracts";

export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  "лекция":        "Лек",
  "практика":      "Пр",
  "лаб":           "Лаб",
  "день_практики": "Пр",
};

export const LESSON_TYPE_COLOR: Record<LessonType, string> = {
  "лекция":        "#4B9EE5",
  "практика":      "#7C5CBF",
  "лаб":           "#2EA05A",
  "день_практики": "#E5A94B",
};

// Цвет оценки (5-балльная шкала)
export function gradeColor(v?: number | null): string {
  if (!v) return "var(--c-text-muted)";
  if (v >= 5) return "var(--c-success)";
  if (v >= 4) return "var(--c-accent)";
  if (v >= 3) return "#E5A94B";
  return "var(--c-danger)";
}

// Цвет % выполнения (прогресс-бар)
export function progressColor(pct: number): string {
  if (pct >= 75) return "var(--c-success)";
  if (pct >= 40) return "var(--c-accent)";
  return "var(--c-danger)";
}
