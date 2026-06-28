import { useState, useEffect } from "react";

export type Route =
  // ── новые маршруты (Shell v2) ──
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
  // ── старые маршруты (legacy Trajectory) ──
  | { name: "disciplines" }
  | { name: "profiles" }
  | { name: "completed"; contextId: string }
  | { name: "discipline"; id: string }
  | { name: "pm"; id: string }
  | { name: "practice"; id: string };

export function parseHash(hash: string): Route {
  const path = hash.startsWith("#/") ? hash.slice(2) : hash.replace(/^#/, "");
  const parts = path.split("/").filter(Boolean);
  const [seg0, seg1] = parts;

  // новые маршруты
  if (seg0 === "performance")   return { name: "performance" };
  if (seg0 === "gradebook")     return { name: "gradebook" };
  if (seg0 === "tasks")         return { name: "tasks" };
  if (seg0 === "profile")       return { name: "profile" };
  if (seg0 === "contexts")      return { name: "contexts" };
  if (seg0 === "notifications") return seg1 ? { name: "notification", id: seg1 } : { name: "notifications" };
  if (seg0 === "unit"   && seg1) return { name: "unit",   id: seg1 };
  if (seg0 === "group"  && seg1) return { name: "group",  id: seg1 };
  if (seg0 === "lesson" && seg1) return { name: "lesson", id: seg1 };
  // legacy
  if (seg0 === "disciplines")        return { name: "disciplines" };
  if (seg0 === "profiles")           return seg1 ? { name: "completed", contextId: seg1 } : { name: "profiles" };
  if (seg0 === "discipline" && seg1) return { name: "discipline", id: seg1 };
  if (seg0 === "pm"         && seg1) return { name: "pm",         id: seg1 };
  if (seg0 === "practice"   && seg1) return { name: "practice",   id: seg1 };
  return { name: "schedule" };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case "schedule":      return "#/";
    case "performance":   return "#/performance";
    case "gradebook":     return "#/gradebook";
    case "tasks":         return "#/tasks";
    case "profile":       return "#/profile";
    case "contexts":      return "#/contexts";
    case "notifications": return "#/notifications";
    case "notification":  return `#/notifications/${route.id}`;
    case "lesson":        return `#/lesson/${route.id}`;
    case "unit":          return `#/unit/${route.id}`;
    case "group":         return `#/group/${route.id}`;
    // legacy
    case "disciplines":   return "#/disciplines";
    case "profiles":      return "#/profiles";
    case "completed":     return `#/profiles/${route.contextId}`;
    case "discipline":    return `#/discipline/${route.id}`;
    case "pm":            return `#/pm/${route.id}`;
    case "practice":      return `#/practice/${route.id}`;
  }
}

export function navigate(route: Route): void {
  window.location.hash = routeToHash(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const update = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}
