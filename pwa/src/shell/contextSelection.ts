/**
 * Логика выбора текущей роли по Block I §10.
 *
 * Помогает AppShell ответить на вопрос "что показать пользователю":
 *  - Если у физика 0 ролей → empty state ("Нет активных ролей")
 *  - Если 1 роль → автоматически выбрана
 *  - Если N ролей → spawn RoleSelector
 *
 * Выбор сохраняется в sessionStorage (переживает F5, сбрасывается при logout).
 */
import type { ContextsResponse } from "../data/contexts.js";

/** Роли которые сейчас доступны юзеру (имеют хотя бы 1 контекст). */
export type AvailableRole = "student" | "parent" | "teacher" | "examiner" | "applicant";

const STORAGE_KEY = "eios_selected_role";

export function availableRoles(c: ContextsResponse): AvailableRole[] {
  const out: AvailableRole[] = [];
  if (c.student.length   > 0) out.push("student");
  if (c.parent.length    > 0) out.push("parent");
  if (c.teacher.length   > 0) out.push("teacher");
  if (c.examiner.length  > 0) out.push("examiner");
  if (c.applicant.length > 0) out.push("applicant");
  return out;
}

/** Дефолтный контекст для роли — первый в списке (Block I §10.2).
 *  Для teacher: предпочитаем instructor, остальные kinds как fallback. */
export function firstContextOf(role: AvailableRole, c: ContextsResponse): string | null {
  switch (role) {
    case "student":   return c.student[0]?.context_id   ?? null;
    case "parent":    return c.parent[0]?.context_id    ?? null;
    case "teacher": {
      const instructor = c.teacher.find(t => t.kind === "instructor");
      return (instructor ?? c.teacher[0])?.context_id ?? null;
    }
    case "examiner":  return c.examiner[0]?.context_id  ?? null;
    case "applicant": return c.applicant[0]?.context_id ?? null;
  }
}

export function getSavedRole(): AvailableRole | null {
  const r = sessionStorage.getItem(STORAGE_KEY);
  return (r === "student" || r === "parent" || r === "teacher"
       || r === "examiner" || r === "applicant") ? r : null;
}

export function saveRole(role: AvailableRole): void {
  sessionStorage.setItem(STORAGE_KEY, role);
}

export function clearRole(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
