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

export function parseHash(hash: string): Route {
  const path = hash.startsWith("#/") ? hash.slice(2) : hash.replace(/^#/, "");
  const parts = path.split("/").filter(Boolean);
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
