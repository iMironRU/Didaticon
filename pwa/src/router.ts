/**
 * Роутинг по pathname + History API (без `#`).
 *
 * Block I §7: путь имеет необязательный контекст-префикс
 *   /{role}/{contextId}/{view}
 *
 * Если префикс отсутствует — навигация работает в "anonymous" режиме
 * (бэкап для старых закладок). AppShell дополняет URL до канонического
 * вида после первой навигации.
 *
 * Примеры:
 *   /student/stu:s1/schedule
 *   /parent/par:p1-c1/profile
 *   /lesson/abc            ← legacy без ctx, тоже работает
 *
 * SPA-fallback на nginx-стороне (`try_files $uri /index.html`) гарантирует,
 * что любой неизвестный путь отдаст index.html — React сам разберётся.
 *
 * Не пересекается с:
 *   /admin.html  — реальный файл
 *   /scorm/*     — реальные файлы из volume
 *   /assets/*    — хешированные бандлы
 *   /api/*       — проксируется Caddy на glue
 *   /callback    — main.tsx ловит до рендера, делает replaceState на "/"
 */
import { useState, useEffect } from "react";

export type Route =
  | { name: "schedule" }
  | { name: "performance" }
  | { name: "gradebook" }
  | { name: "tasks" }          // педагог: очередь заданий на проверку
  | { name: "profile" }
  | { name: "contexts" }
  | { name: "notifications" }
  | { name: "notification"; id: string }
  | { name: "lesson";  id: string }     // SlotId
  | { name: "unit";    id: string }     // UnitId (discipline/MDK/practice)
  | { name: "group";   id: string }     // UnitId (ПМ)
  | { name: "estudent" }                // e-Student card (Block I §9)
  | { name: "accessibility" };          // публичная декларация (a11y политика §7.5)

/** Контекст из URL: роль + id контекста (формат glue: "stu:s1", "par:p1-c1", ...). */
export interface ContextRef {
  role:      string;
  contextId: string;
}

const ROLE_SEGMENTS = new Set(["student", "parent", "teacher", "examiner", "applicant"]);

export function parsePath(pathname: string): { route: Route; ctx: ContextRef | null } {
  const parts = pathname.split("/").filter(Boolean);

  // /{role}/{contextId}/... → отрезаем префикс
  let ctx: ContextRef | null = null;
  let viewParts = parts;
  if (parts.length >= 2 && ROLE_SEGMENTS.has(parts[0])) {
    ctx = { role: parts[0], contextId: parts[1] };
    viewParts = parts.slice(2);
  }

  return { ctx, route: parseViewParts(viewParts) };
}

function parseViewParts(parts: string[]): Route {
  const [seg0, seg1] = parts;
  if (seg0 === "performance")    return { name: "performance" };
  if (seg0 === "gradebook")      return { name: "gradebook" };
  if (seg0 === "tasks")          return { name: "tasks" };
  if (seg0 === "profile")        return { name: "profile" };
  if (seg0 === "contexts")       return { name: "contexts" };
  if (seg0 === "notifications")  return seg1 ? { name: "notification", id: seg1 } : { name: "notifications" };
  if (seg0 === "unit"   && seg1) return { name: "unit",   id: seg1 };
  if (seg0 === "group"  && seg1) return { name: "group",  id: seg1 };
  if (seg0 === "lesson" && seg1) return { name: "lesson", id: seg1 };
  if (seg0 === "estudent")       return { name: "estudent" };
  if (seg0 === "accessibility")  return { name: "accessibility" };
  return { name: "schedule" };
}

function viewToPath(route: Route): string {
  switch (route.name) {
    case "schedule":      return "/schedule";
    case "performance":   return "/performance";
    case "gradebook":     return "/gradebook";
    case "tasks":         return "/tasks";
    case "profile":       return "/profile";
    case "contexts":      return "/contexts";
    case "notifications": return "/notifications";
    case "notification":  return `/notifications/${route.id}`;
    case "lesson":        return `/lesson/${route.id}`;
    case "unit":          return `/unit/${route.id}`;
    case "group":         return `/group/${route.id}`;
    case "estudent":      return "/estudent";
    case "accessibility": return "/accessibility";
  }
}

export function routeToPath(route: Route, ctx?: ContextRef | null): string {
  if (!ctx) {
    // Без контекста — bare path. Для "/" (schedule корень) возвращаем "/".
    const view = viewToPath(route);
    return view === "/schedule" ? "/" : view;
  }
  // contextId не кодируем — формат glue ("stu:s1", "par:p1-c1") URL-safe
  // (":" и "-" разрешены в path-сегментах по RFC 3986).
  const prefix = `/${ctx.role}/${ctx.contextId}`;
  // Schedule = "корневой" вид контекста, его путь = только префикс.
  return route.name === "schedule" ? prefix : `${prefix}${viewToPath(route)}`;
}

const NAV_EVENT = "eios:navigation";

/**
 * Переход к route. Если ctx не задан — наследуем текущий из URL.
 * Это даёт всем существующим вызовам `navigate({name: "lesson", id})` сохранить
 * контекст автоматически.
 */
export function navigate(route: Route, ctx?: ContextRef | null): void {
  const useCtx = ctx === undefined ? parsePath(window.location.pathname).ctx : ctx;
  const path = routeToPath(route, useCtx);
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(NAV_EVENT));
}

/** Заменяет текущий URL без push в history. Используется для backward-compat
 *  редиректа `/schedule` → `/student/stu:s1/schedule` после определения контекста. */
export function replacePath(route: Route, ctx?: ContextRef | null): void {
  const useCtx = ctx === undefined ? parsePath(window.location.pathname).ctx : ctx;
  const path = routeToPath(route, useCtx);
  if (window.location.pathname === path) return;
  window.history.replaceState({}, "", path);
  window.dispatchEvent(new Event(NAV_EVENT));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parsePath(window.location.pathname).route);
  useEffect(() => {
    const update = () => setRoute(parsePath(window.location.pathname).route);
    window.addEventListener("popstate", update);
    window.addEventListener(NAV_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(NAV_EVENT, update);
    };
  }, []);
  return route;
}

/** Текущий контекст из URL (или null если URL без префикса). Реактивный. */
export function useRouteContext(): ContextRef | null {
  const [ctx, setCtx] = useState(() => parsePath(window.location.pathname).ctx);
  useEffect(() => {
    const update = () => setCtx(parsePath(window.location.pathname).ctx);
    window.addEventListener("popstate", update);
    window.addEventListener(NAV_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(NAV_EVENT, update);
    };
  }, []);
  return ctx;
}
