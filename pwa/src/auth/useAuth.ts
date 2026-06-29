/**
 * Auth-state машина + хуки.
 *
 * USE_MOCK / DEMO_PERSONA — module-level константы, вычисляются один раз
 * при загрузке модуля (берутся из ?demo= в URL или import.meta.env.DEV).
 *
 * Backwards-compat note (2026-06-29): по Block I §7 у физика теперь массив
 * `roles[]`. Этот хук пока возвращает первую роль (single) для совместимости
 * с текущим AppShell. Полная переработка под multi-role context-switcher —
 * [[tech-debt]] Block I этап 6.
 */
import { useEffect, useState } from "react";
import type { StudentId } from "@eios/contracts";
import { login, logout, getUser, type RoleName, type PersonIdentity } from "./oidc.js";

/** @deprecated используйте Role[] из oidc.ts */
export type EiosRole = "student" | "parent" | "teacher";

export type AuthState =
  | { phase: "checking" }
  | { phase: "anonymous" }
  | { phase: "logging_in" }
  | { phase: "error"; message: string }
  | {
      phase:    "authenticated";
      studentId: StudentId;
      role:     EiosRole;            // backward-compat: одна роль для текущего AppShell
      name:     string;
      identity?: PersonIdentity;     // полная identity (все роли + модификаторы), для будущего multi-role UI
    };

const _searchParams = new URLSearchParams(window.location.search);
export const USE_MOCK = import.meta.env.DEV || _searchParams.has("demo");
export const DEMO_PERSONA: EiosRole =
  _searchParams.get("demo") === "parent"  ? "parent"  :
  _searchParams.get("demo") === "teacher" ? "teacher" : "student";

/** Из массива ролей физика выбираем "основную" для текущего single-role AppShell.
 *  Приоритет: student > teacher > parent > examiner > applicant. Если ни одна
 *  не из старого enum — fallback "student". */
const PRIORITY: RoleName[] = ["student", "teacher", "parent", "examiner", "applicant"];
function pickPrimaryRole(roles: PersonIdentity["roles"]): EiosRole {
  for (const p of PRIORITY) {
    if (roles.some((r) => r.name === p)) {
      // examiner/applicant пока не поддерживаются в AppShell — мапим на student как fallback
      if (p === "student" || p === "teacher" || p === "parent") return p;
      return "student";
    }
  }
  return "student";
}

export interface AuthHook {
  auth:   AuthState;
  login:  () => Promise<void>;
  logout: () => void;
}

export function useAuth(): AuthHook {
  const [auth, setAuth] = useState<AuthState>(
    USE_MOCK
      ? { phase: "authenticated", studentId: "s-mock" as StudentId, role: DEMO_PERSONA, name: "" }
      : { phase: "checking" }
  );

  useEffect(() => {
    if (USE_MOCK) return;
    getUser()
      .then((u) => {
        if (u) {
          const returnPath = sessionStorage.getItem("eios_return_path");
          if (returnPath) {
            sessionStorage.removeItem("eios_return_path");
            window.history.replaceState({}, "", returnPath);
          }
          localStorage.setItem("eios_has_logged_in_before", "1");
          setAuth({
            phase:     "authenticated",
            studentId: u.sub as unknown as StudentId,
            role:      pickPrimaryRole(u.roles),
            name:      u.name,
            identity:  u,
          });
        } else {
          setAuth({ phase: "anonymous" });
        }
      })
      .catch(() => setAuth({ phase: "anonymous" }));
  }, []);

  function handleLogout() {
    sessionStorage.clear();
    if (!USE_MOCK) {
      logout();
      return;
    }
    setAuth({ phase: "anonymous" });
  }

  async function handleLogin() {
    setAuth({ phase: "logging_in" });
    const path = window.location.pathname + window.location.search;
    if (path !== "/" && !path.startsWith("/callback")) {
      sessionStorage.setItem("eios_return_path", path);
    }
    try {
      await login();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAuth({ phase: "error", message: msg });
    }
  }

  return { auth, login: handleLogin, logout: handleLogout };
}
