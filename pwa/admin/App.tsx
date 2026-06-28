/**
 * AdminApp — корневой компонент админки.
 *
 * Если нет токена → LoginScreen. Если есть → Shell с 8 вкладками.
 *
 * Auth: token-only (этап 1). OIDC будет в следующем коммите.
 */
import { useState } from "react";
import { getToken, clearToken } from "./auth.js";
import { LoginScreen } from "./LoginScreen.js";
import { AdminShell } from "./Shell.js";
import { ToastQueue } from "../src/ui/Toast.js";
import { ConfirmProvider } from "../src/ui/Confirm.js";

export function AdminApp() {
  const [authed, setAuthed] = useState(!!getToken());

  function handleLogout() {
    clearToken();
    setAuthed(false);
  }

  return (
    <ToastQueue>
      <ConfirmProvider>
        {authed
          ? <AdminShell onLogout={handleLogout} />
          : <LoginScreen onLogin={() => setAuthed(true)} />}
      </ConfirmProvider>
    </ToastQueue>
  );
}
