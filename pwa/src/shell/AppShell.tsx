/**
 * AppShell — единственный entry point для авторизованного пользователя.
 *
 * Логика по Block I §10 + §7 (routing):
 *  - Загружаем `identity.contexts.get` через useContexts()
 *  - Контекст в URL: /{role}/{contextId}/{view}
 *  - URL без префикса → выводим до канонического вида через replacePath
 *  - 0 ролей → "Нет активных ролей"
 *  - 1 роль → автоматический выбор + первый контекст
 *  - N ролей без выбора → RoleSelector
 *  - sessionStorage сохраняет выбранную роль для F5
 *
 * Demo-режим (?demo=…) — DEMO_PERSONA фиксирует роль, mock-контексты подставляются.
 */
import { useEffect, useState } from "react";
import { useRoute, useRouteContext, navigate, replacePath } from "../router.js";
import { canAccess, defaultRoute } from "../permissions.js";
import { LocaleProvider } from "../locale.js";
import { useContexts } from "../data/contexts.js";
import { USE_MOCK } from "../auth/mock.js";
import { Spinner } from "../ui/Spinner.js";
import { Card } from "../ui/Card.js";
import { Button } from "../ui/Button.js";
import { TeacherView } from "./TeacherView.js";
import { StudentView } from "./StudentView.js";
import { RoleSelector } from "./RoleSelector.js";
import {
  availableRoles, firstContextOf, getSavedRole, saveRole, clearRole,
  type AvailableRole,
} from "./contextSelection.js";

interface Props {
  role:      "student" | "parent" | "teacher";   // backward-compat single
  authName:  string;
  lkUrl?:    string;
  onLogout?: () => void;
}

/** examiner/applicant ещё не имеют своего view — fallback на student. */
function toLegacyRole(r: AvailableRole | null): "student" | "parent" | "teacher" {
  if (r === "teacher" || r === "parent" || r === "student") return r;
  return "student";
}

export function AppShell({ role: legacyRole, authName, lkUrl, onLogout }: Props) {
  // ── Hooks (всегда вызываются, без условий) ────────────────────────────
  const route   = useRoute();
  const urlCtx  = useRouteContext();
  const { contexts, loading, error } = useContexts();

  const [selected, setSelected] = useState<AvailableRole | null>(
    () => USE_MOCK ? (legacyRole as AvailableRole) : getSavedRole(),
  );

  // Derived: какая роль "сейчас активна" (приоритет: URL → selected → solo → legacy)
  const available  = contexts ? availableRoles(contexts) : [];
  const urlRole    = urlCtx?.role as AvailableRole | undefined;
  const inferredRole: AvailableRole | null =
    urlRole && (USE_MOCK || available.includes(urlRole)) ? urlRole :
    selected && (USE_MOCK || available.includes(selected)) ? selected :
    available.length === 1 ? available[0] :
    null;
  const dispatchRole = toLegacyRole(inferredRole ?? (legacyRole as AvailableRole));

  // Effect: каноникализация URL — если контекст определён но в URL префикса нет,
  // дописываем /{role}/{contextId}/ через replaceState (не плодим history).
  useEffect(() => {
    if (!contexts || !inferredRole || urlCtx) return;
    const cid = firstContextOf(inferredRole, contexts);
    if (cid) replacePath(route, { role: inferredRole, contextId: cid });
  }, [contexts, inferredRole, urlCtx, route]);

  // Effect: сохраняем выбранную роль в sessionStorage при single-role auto-pick
  useEffect(() => {
    if (inferredRole && !selected && !USE_MOCK) {
      saveRole(inferredRole);
      setSelected(inferredRole);
    }
  }, [inferredRole, selected]);

  // Effect: permissions-guard
  useEffect(() => {
    if (!canAccess(dispatchRole, route)) navigate(defaultRoute(dispatchRole));
  }, [dispatchRole, route]);

  function handleLogout() {
    clearRole();
    onLogout?.();
  }

  function handleRolePick(r: AvailableRole) {
    if (contexts) {
      const cid = firstContextOf(r, contexts);
      if (cid) navigate(defaultRoute(toLegacyRole(r)), { role: r, contextId: cid });
    }
    saveRole(r);
    setSelected(r);
  }

  // ── Рендеринг ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 text-fg-muted">
          <Spinner size={20} /> Загрузка контекстов…
        </div>
      </div>
    );
  }

  if (error && !USE_MOCK) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <Card className="px-4 py-4 max-w-sm">
          <div className="text-danger text-sm font-medium mb-2">Не удалось загрузить роли</div>
          <div className="text-fg-muted text-xs mb-4">{error}</div>
          <Button variant="secondary" size="md" className="w-full" onClick={handleLogout}>
            Выйти и попробовать снова
          </Button>
        </Card>
      </div>
    );
  }

  if (!USE_MOCK && contexts && available.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <Card className="px-4 py-6 max-w-sm text-center">
          <div className="text-3xl mb-3">🤷</div>
          <div className="text-fg text-base font-medium mb-2">Нет активных ролей</div>
          <div className="text-fg-muted text-sm mb-4">
            В вашем профиле Дидактикона нет ни одной активной роли. Обратитесь в учебную часть или к администратору.
          </div>
          <Button variant="secondary" size="md" className="w-full" onClick={handleLogout}>
            Выйти
          </Button>
        </Card>
      </div>
    );
  }

  // RoleSelector — N ролей и роль ещё не определена ни URL, ни sessionStorage
  if (!USE_MOCK && contexts && !inferredRole && available.length > 1) {
    return (
      <RoleSelector
        identity={{ name: authName || "Пользователь", eiv: "—" }}
        contexts={contexts}
        available={available}
        onPick={handleRolePick}
        onLogout={handleLogout}
      />
    );
  }

  // Dispatch в существующие views
  if (dispatchRole === "teacher") {
    return <TeacherView authName={authName} lkUrl={lkUrl} onLogout={handleLogout} />;
  }

  return (
    <LocaleProvider>
      <StudentView role={dispatchRole} lkUrl={lkUrl} onLogout={handleLogout} />
    </LocaleProvider>
  );
}
