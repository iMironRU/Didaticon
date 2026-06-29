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
