import { useState, useEffect } from "react";

export type Route =
  | { name: "schedule" }
  | { name: "disciplines" }
  | { name: "profile" }
  | { name: "gradebook" }
  | { name: "profiles" }
  | { name: "completed"; contextId: string }
  | { name: "notifications" }
  | { name: "notification"; id: string }
  | { name: "discipline"; id: string }
  | { name: "lesson"; id: string };

export function parseHash(hash: string): Route {
  const path = hash.startsWith("#/") ? hash.slice(2) : hash.replace(/^#/, "");
  const parts = path.split("/").filter(Boolean);
  const [seg0, seg1] = parts;

  if (seg0 === "disciplines")   return { name: "disciplines" };
  if (seg0 === "profile")       return { name: "profile" };
  if (seg0 === "gradebook")     return { name: "gradebook" };
  if (seg0 === "profiles")      return seg1 ? { name: "completed", contextId: seg1 } : { name: "profiles" };
  if (seg0 === "notifications") return seg1 ? { name: "notification", id: seg1 } : { name: "notifications" };
  if (seg0 === "discipline" && seg1) return { name: "discipline", id: seg1 };
  if (seg0 === "lesson"      && seg1) return { name: "lesson",      id: seg1 };
  return { name: "schedule" };
}

export function routeToHash(route: Route): string {
  switch (route.name) {
    case "schedule":      return "#/";
    case "disciplines":   return "#/disciplines";
    case "profile":       return "#/profile";
    case "gradebook":     return "#/gradebook";
    case "profiles":      return "#/profiles";
    case "completed":     return `#/profiles/${route.contextId}`;
    case "notifications": return "#/notifications";
    case "notification":  return `#/notifications/${route.id}`;
    case "discipline":    return `#/discipline/${route.id}`;
    case "lesson":        return `#/lesson/${route.id}`;
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
