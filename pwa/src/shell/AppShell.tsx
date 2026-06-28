/**
 * AppShell — единственный entry point для авторизованного пользователя.
 *
 * Делает общие вещи:
 * 1. Permissions-guard: если роль не имеет доступа к текущему маршруту —
 *    редиректит на defaultRoute(role).
 * 2. Диспатч по роли в TeacherView | StudentView.
 *
 * Сами View пока владеют своей chrome (Header/BottomNav/StatusBar) и
 * собственными данными через data/source. Дальнейшая унификация chrome —
 * предмет будущего рефакторинга, не блокирует ничего.
 *
 * App.tsx теперь не знает о ролевых компонентах — только об AppShell.
 *
 * См. memory: architecture.md → правила 1, 4.
 */
import { useEffect } from "react";
import { useRoute, navigate } from "../router.js";
import { canAccess, defaultRoute } from "../permissions.js";
import { LocaleProvider } from "../locale.js";
import type { Role } from "../data/source.js";
import { TeacherView } from "./TeacherView.js";
import { StudentView } from "./StudentView.js";

interface Props {
  role:      Role;
  /** ФИО из auth (для педагога). Пустая строка → demo-юзер. */
  authName:  string;
  lkUrl?:    string;
  onLogout?: () => void;
}

export function AppShell({ role, authName, lkUrl, onLogout }: Props) {
  const route = useRoute();

  // Если роль не имеет доступа к маршруту — редирект на дефолтный для роли.
  useEffect(() => {
    if (!canAccess(role, route)) navigate(defaultRoute(role));
  }, [role, route]);

  if (role === "teacher") {
    return <TeacherView authName={authName} lkUrl={lkUrl} onLogout={onLogout} />;
  }

  return (
    <LocaleProvider>
      <StudentView role={role} lkUrl={lkUrl} onLogout={onLogout} />
    </LocaleProvider>
  );
}
