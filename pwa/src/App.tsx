/**
 * Корневой компонент: auth + branding → AppShell / Splash / LogoutScreen / LoginScreen.
 *
 * Логика разнесена по модулям:
 *   auth/useAuth.ts        — state-машина авторизации + login/logout
 *   branding/useBranding.ts — fetch /api/branding и merge с DEFAULT_BRANDING
 *   screens/login/         — экраны входа и доступа
 *   screens/Splash         — пока auth checking (избегаем flash LoginScreen)
 *   screens/LogoutScreen   — однократный экран сразу после logout
 *   shell/AppShell.tsx     — авторизованный шелл (диспатч по роли)
 */
import { useState } from "react";
import { useAuth, USE_MOCK, DEMO_PERSONA } from "./auth/useAuth.js";
import { useBranding } from "./branding/useBranding.js";
import { AppShell } from "./shell/AppShell.js";
import { LoginScreen } from "./screens/login/LoginScreen.js";
import { Splash } from "./screens/Splash.js";
import { LogoutScreen } from "./screens/LogoutScreen.js";

export function App() {
  const { auth, login, logout } = useAuth();
  const branding = useBranding();

  // Однократный logout-флаг (живёт пока пользователь не кликнул "Войти снова"
  // или не обновил вкладку — после React-mount читаем в useState, потом удаляем
  // из storage чтобы не показать второй раз случайно).
  const [showLogoutScreen, setShowLogoutScreen] = useState(() => {
    const flag = sessionStorage.getItem("eios_just_logged_out") === "1";
    if (flag) sessionStorage.removeItem("eios_just_logged_out");
    return flag;
  });

  if (auth.phase === "authenticated") {
    return (
      <AppShell
        role={USE_MOCK ? DEMO_PERSONA : auth.role}
        authName={USE_MOCK ? "" : auth.name}
        lkUrl={branding.lkUrl ?? undefined}
        onLogout={logout}
      />
    );
  }

  // Пока идёт проверка сессии / callback — splash вместо мигания LoginScreen.
  if (auth.phase === "checking") {
    const isCallback = window.location.pathname === "/callback";
    return <Splash branding={branding} message={isCallback ? "Завершаем вход…" : "Проверка сессии…"} />;
  }

  if (showLogoutScreen) {
    return (
      <LogoutScreen
        branding={branding}
        onLoginAgain={() => { setShowLogoutScreen(false); login(); }}
      />
    );
  }

  return <LoginScreen auth={auth} onLogin={login} branding={branding} />;
}
