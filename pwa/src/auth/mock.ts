/**
 * Demo-режим — определяется ОДИН раз при загрузке модуля по URL-параметру
 * `?demo=` или import.meta.env.DEV. Не меняется в течение сессии.
 *
 * Вынесен в отдельный файл (а не оставлен в useAuth.ts) чтобы избежать
 * циклической зависимости: data/contexts.ts ← auth/useAuth.ts ←
 * data/contexts.ts (resetContexts). data/contexts может импортить из mock.ts
 * напрямую.
 */
export type DemoPersona = "student" | "parent" | "teacher" | "curator" | "senior-grader";

const _searchParams = new URLSearchParams(window.location.search);

export const USE_MOCK = import.meta.env.DEV || _searchParams.has("demo");

export const DEMO_PERSONA: DemoPersona =
  _searchParams.get("demo") === "parent"         ? "parent"         :
  _searchParams.get("demo") === "teacher"        ? "teacher"        :
  _searchParams.get("demo") === "curator"        ? "curator"        :
  _searchParams.get("demo") === "senior-grader"  ? "senior-grader"  : "student";

/** Маппинг demo-персоны в AppShell role: curator/senior-grader — это виды teacher. */
export function personaToRole(p: DemoPersona): "student" | "parent" | "teacher" {
  if (p === "curator" || p === "senior-grader") return "teacher";
  return p;
}
