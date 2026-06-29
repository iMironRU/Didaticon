/**
 * AppShell — единственный entry point для авторизованного пользователя.
 *
 * Логика по Block I §10:
 *  - Загружаем `identity.contexts.get` через useContexts()
 *  - Если 0 ролей → пустой экран "Нет активных ролей"
 *  - Если 1 роль → сразу диспатч в StudentView/TeacherView/...
 *  - Если N ролей → RoleSelector (если в sessionStorage нет сохранённого выбора)
 *  - Выбор переживает F5, сбрасывается на logout
 *
 * Demo-режим (?demo=…) не использует RoleSelector — DEMO_PERSONA фиксирует роль.
 *
 * См. memory: didakticon_block1_identity.md §10, architecture.md правила 1, 4.
 */
import { useEffect, useState } from "react";
import { useRoute, navigate } from "../router.js";
import { canAccess, defaultRoute } from "../permissions.js";
import { LocaleProvider } from "../locale.js";
import { useContexts } from "../data/contexts.js";
import { USE_MOCK } from "../auth/mock.js";
import { Spinner } from "../ui/Spinner.js";
import { Card } from "../ui/Card.js";
import { TeacherView } from "./TeacherView.js";
import { StudentView } from "./StudentView.js";
import { RoleSelector } from "./RoleSelector.js";
import {
  availableRoles, getSavedRole, saveRole, clearRole,
  type AvailableRole,
} from "./contextSelection.js";

interface Props {
  /** Роль из useAuth (в backward-compat single-role режиме). В demo фиксирует DEMO_PERSONA. */
  role:      "student" | "parent" | "teacher";
  /** ФИО из auth (для педагога). Пустая строка → demo-юзер. */
  authName:  string;
  lkUrl?:    string;
  onLogout?: () => void;
}

export function AppShell({ role: legacyRole, authName, lkUrl, onLogout }: Props) {
  const route = useRoute();
  const { contexts, loading, error } = useContexts();

  // Демо — DEMO_PERSONA уже выбрана из URL, скип селектор.
  // Реальный режим — выбор сохраняется в sessionStorage.
  const [selected, setSelected] = useState<AvailableRole | null>(
    () => USE_MOCK ? (legacyRole as AvailableRole) : getSavedRole(),
  );

  // Permissions-guard по выбранной (или legacy) роли
  const activeRole = (selected ?? legacyRole) as "student" | "parent" | "teacher";
  useEffect(() => {
    if (!canAccess(activeRole, route)) navigate(defaultRoute(activeRole));
  }, [activeRole, route]);

  function handleLogout() {
    clearRole();
    onLogout?.();
  }

  // ── Loading / errors ─────────────────────────────────────────────────────
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
          <div className="text-danger text-sm font-medium mb-2">
            Не удалось загрузить роли
          </div>
          <div className="text-fg-muted text-xs mb-4">{error}</div>
          <button onClick={handleLogout} className="text-accent text-sm">
            Выйти и попробовать снова
          </button>
        </Card>
      </div>
    );
  }

  // ── Multi-role: показать селектор если ещё не выбрана ──────────────────
  if (!USE_MOCK && contexts) {
    const available = availableRoles(contexts);

    if (available.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
          <Card className="px-4 py-6 max-w-sm text-center">
            <div className="text-3xl mb-3">🤷</div>
            <div className="text-fg text-base font-medium mb-2">
              Нет активных ролей
            </div>
            <div className="text-fg-muted text-sm mb-4">
              В вашем профиле Дидактикона нет ни одной активной роли. Обратитесь в учебную часть или к администратору.
            </div>
            <button onClick={handleLogout} className="text-accent text-sm">
              Выйти
            </button>
          </Card>
        </div>
      );
    }

    if (available.length > 1 && !selected) {
      // Контексты загружены, ролей несколько, выбор ещё не сделан → RoleSelector
      const identityName = authName || "Пользователь";
      const eiv = "—"; // ЕИВ придёт через PersonIdentity, для MVP заглушка
      return (
        <RoleSelector
          identity={{ name: identityName, eiv }}
          contexts={contexts}
          available={available}
          onPick={(r) => { saveRole(r); setSelected(r); }}
          onLogout={handleLogout}
        />
      );
    }

    // 1 роль ИЛИ выбор уже сохранён → продолжаем как раньше
    // (если selected отсутствует — берём единственную доступную)
    if (!selected && available.length === 1) {
      // Чтобы при F5 не передёргивать — сохраним
      saveRole(available[0]);
    }
  }

  // ── Dispatch в существующие views ───────────────────────────────────────
  // examiner/applicant пока не поддерживаются — fallback на student
  const dispatchRole =
    activeRole === "teacher" ? "teacher" :
    activeRole === "parent"  ? "parent"  : "student";

  if (dispatchRole === "teacher") {
    return <TeacherView authName={authName} lkUrl={lkUrl} onLogout={handleLogout} />;
  }

  return (
    <LocaleProvider>
      <StudentView role={dispatchRole} lkUrl={lkUrl} onLogout={handleLogout} />
    </LocaleProvider>
  );
}
