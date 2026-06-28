/**
 * Auth-state машина + хуки.
 *
 * USE_MOCK / DEMO_PERSONA — module-level константы, вычисляются один раз
 * при загрузке модуля (берутся из ?demo= в URL или import.meta.env.DEV).
 */
import { useEffect, useState } from "react";
import type { StudentId } from "@eios/contracts";
import { login, logout, getUser, type EiosRole } from "./oidc.js";

export type AuthState =
  | { phase: "checking" }
  | { phase: "anonymous" }
  | { phase: "logging_in" }
  | { phase: "error"; message: string }
  | { phase: "authenticated"; studentId: StudentId; role: EiosRole; name: string };

const _searchParams = new URLSearchParams(window.location.search);
export const USE_MOCK = import.meta.env.DEV || _searchParams.has("demo");
export const DEMO_PERSONA: EiosRole =
  _searchParams.get("demo") === "parent"  ? "parent"  :
  _searchParams.get("demo") === "teacher" ? "teacher" : "student";

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
          const returnHash = sessionStorage.getItem("eios_return_hash");
          if (returnHash) { sessionStorage.removeItem("eios_return_hash"); window.location.hash = returnHash; }
          setAuth({ phase: "authenticated", studentId: u.id, role: u.role, name: u.name });
        } else {
          setAuth({ phase: "anonymous" });
        }
      })
      .catch(() => setAuth({ phase: "anonymous" }));
  }, []);

  function handleLogout() {
    sessionStorage.clear();
    if (!USE_MOCK) {
      logout(); // signoutRedirect: очищает localStorage + редирект на Auth0
      return;
    }
    setAuth({ phase: "anonymous" });
  }

  async function handleLogin() {
    setAuth({ phase: "logging_in" });
    // Сохраняем хеш чтобы восстановить экран после OIDC-редиректа
    if (window.location.hash && window.location.hash !== "#/") {
      sessionStorage.setItem("eios_return_hash", window.location.hash);
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
