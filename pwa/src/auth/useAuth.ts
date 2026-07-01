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
import { login, loginAs as oidcLoginAs, logout, getUser, type RoleName, type PersonIdentity } from "./oidc.js";
import { USE_MOCK, DEMO_PERSONA, personaToRole } from "./mock.js";
import { resetContexts } from "../data/contexts.js";

// Re-export для backward-compat с App.tsx и другими consumers
export { USE_MOCK, DEMO_PERSONA };

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
  auth:     AuthState;
  login:    () => Promise<void>;
  loginAs:  (email: string) => Promise<void>;
  logout:   () => void;
}

/** Общая логика "прочитать текущего юзера из oidc и превратить в AuthState".
 *  Нужна и при первой загрузке (mount), и сразу после успешного
 *  signinPopup() — там нет редиректа/перезагрузки страницы, поэтому mount-эффект
 *  не перезапустится сам, состояние надо обновить вручную. */
async function resolveAuth(): Promise<AuthState> {
  const u = await getUser();
  if (!u) return { phase: "anonymous" };
  const returnPath = sessionStorage.getItem("eios_return_path");
  if (returnPath) {
    sessionStorage.removeItem("eios_return_path");
    window.history.replaceState({}, "", returnPath);
  }
  localStorage.setItem("eios_has_logged_in_before", "1");
  return {
    phase:     "authenticated",
    studentId: u.sub as unknown as StudentId,
    role:      pickPrimaryRole(u.roles),
    name:      u.name,
    identity:  u,
  };
}

export function useAuth(): AuthHook {
  const [auth, setAuth] = useState<AuthState>(
    USE_MOCK
      ? { phase: "authenticated", studentId: "s-mock" as StudentId, role: personaToRole(DEMO_PERSONA), name: "" }
      : { phase: "checking" }
  );

  useEffect(() => {
    if (USE_MOCK) return;
    resolveAuth().then(setAuth).catch(() => setAuth({ phase: "anonymous" }));
  }, []);

  function handleLogout() {
    sessionStorage.clear();
    resetContexts();
    if (!USE_MOCK) {
      // Флаг для LogoutScreen — App.tsx покажет его на возврате с Auth0.
      // sessionStorage переживает same-origin редирект Auth0 → /.
      sessionStorage.setItem("eios_just_logged_out", "1");
      logout();
      return;
    }
    setAuth({ phase: "anonymous" });
  }

  function prepareReturnPath() {
    const path = window.location.pathname + window.location.search;
    if (path !== "/" && !path.startsWith("/callback")) {
      sessionStorage.setItem("eios_return_path", path);
    }
  }

  async function handleLogin() {
    setAuth({ phase: "logging_in" });
    prepareReturnPath();
    try {
      await login();
      // signinPopup() не перезагружает страницу — сами читаем свежего юзера.
      setAuth(await resolveAuth());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAuth({ phase: "error", message: msg });
    }
  }

  async function handleLoginAs(email: string) {
    setAuth({ phase: "logging_in" });
    prepareReturnPath();
    try {
      await oidcLoginAs(email);
      setAuth(await resolveAuth());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAuth({ phase: "error", message: msg });
    }
  }

  return { auth, login: handleLogin, loginAs: handleLoginAs, logout: handleLogout };
}
