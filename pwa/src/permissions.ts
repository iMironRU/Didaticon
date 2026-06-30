/**
 * Доступность маршрутов по ролям.
 *
 * Если педагог наберёт `#/gradebook` — шелл редиректит на defaultRoute("teacher").
 * Если студент попадёт на `#/tasks` — то же самое.
 *
 * См. memory: architecture.md → правило 4.
 */
import type { Route } from "./router.js";
import type { Role } from "./data/source.js";

const STUDENT_ROUTES = new Set<Route["name"]>([
  "today", "schedule", "performance", "gradebook", "profile", "contexts",
  "notifications", "notification", "lesson", "unit", "group",
  "estudent",
]);

const TEACHER_ROUTES = new Set<Route["name"]>([
  "today", "schedule", "tasks", "profile", "lesson",
]);

const ROUTES_BY_ROLE: Record<Role, Set<Route["name"]>> = {
  student: STUDENT_ROUTES,
  parent:  STUDENT_ROUTES,
  teacher: TEACHER_ROUTES,
};

export function canAccess(role: Role, route: Route): boolean {
  return ROUTES_BY_ROLE[role].has(route.name);
}

export function defaultRoute(_role: Role): Route {
  return { name: "schedule" };
}
