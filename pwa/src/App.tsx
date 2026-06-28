/**
 * Корневой компонент: auth + branding → AppShell или LoginScreen.
 *
 * Логика разнесена по модулям:
 *   auth/useAuth.ts        — state-машина авторизации + login/logout
 *   branding/useBranding.ts — fetch /api/branding и merge с DEFAULT_BRANDING
 *   screens/login/         — экраны входа и доступа
 *   shell/AppShell.tsx     — авторизованный шелл (диспатч по роли)
 */
import { useAuth, USE_MOCK, DEMO_PERSONA } from "./auth/useAuth.js";
import { useBranding } from "./branding/useBranding.js";
import { AppShell } from "./shell/AppShell.js";
import { LoginScreen } from "./screens/login/LoginScreen.js";

export function App() {
  const { auth, login, logout } = useAuth();
  const branding = useBranding();

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

  return <LoginScreen auth={auth} onLogin={login} branding={branding} />;
}
