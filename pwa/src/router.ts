/**
 * Роутинг по pathname + History API (без `#`).
 *
 * SPA-fallback на nginx-стороне (`try_files $uri /index.html`) гарантирует,
 * что любой неизвестный путь отдаст index.html — React сам разберётся.
 *
 * Не пересекается с:
 *   /admin.html  — реальный файл, nginx сервит до fallback
 *   /scorm/*     — реальные файлы из volume
 *   /assets/*    — хешированные бандлы
 *   /api/*       — проксируется Caddy на glue
 *   /callback    — нет файла; React в main.tsx ловит pathname до рендера
 *                  и сразу делает history.replaceState на "/"
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
  | { name: "group";   id: string };    // UnitId (ПМ)

export function parsePath(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean);
  const [seg0, seg1] = parts;
  if (seg0 === "performance")   return { name: "performance" };
  if (seg0 === "gradebook")     return { name: "gradebook" };
  if (seg0 === "tasks")         return { name: "tasks" };
  if (seg0 === "profile")       return { name: "profile" };
  if (seg0 === "contexts")      return { name: "contexts" };
  if (seg0 === "notifications") return seg1 ? { name: "notification", id: seg1 } : { name: "notifications" };
  if (seg0 === "unit"   && seg1) return { name: "unit",   id: seg1 };
  if (seg0 === "group"  && seg1) return { name: "group",  id: seg1 };
  if (seg0 === "lesson" && seg1) return { name: "lesson", id: seg1 };
  return { name: "schedule" };
}

export function routeToPath(route: Route): string {
  switch (route.name) {
    case "schedule":      return "/";
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
  }
}

const NAV_EVENT = "eios:navigation";

export function navigate(route: Route): void {
  const path = routeToPath(route);
  if (window.location.pathname === path) return; // не плодим дубли в истории
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(NAV_EVENT));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parsePath(window.location.pathname));
  useEffect(() => {
    const update = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener("popstate", update);       // браузерные back/forward
    window.addEventListener(NAV_EVENT, update);        // наша navigate()
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(NAV_EVENT, update);
    };
  }, []);
  return route;
}
