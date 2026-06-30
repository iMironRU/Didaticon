/**
 * RoleSelector — экран выбора роли при multi-role физике (Block I §10).
 *
 * Full-screen, без bottom-nav. Большие кнопки с описанием количества
 * контекстов в каждой роли.
 *
 * НЕ показывается при 1 роли (AppShell сразу dispatch'ит в view).
 */
import type { ContextsResponse } from "../data/contexts.js";
import type { AvailableRole } from "./contextSelection.js";
import { Card } from "../ui/Card.js";
import { Button } from "../ui/Button.js";
import { usePersonIdLabel } from "../branding/usePersonIdLabel.js";

interface Props {
  identity: { name: string; eiv: string };
  contexts: ContextsResponse;
  available: AvailableRole[];
  onPick:   (role: AvailableRole) => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<AvailableRole, { title: string; icon: string }> = {
  student:   { title: "Я учусь",         icon: "🎓" },
  parent:    { title: "Я родитель",       icon: "👨‍👧" },
  teacher:   { title: "Я преподаю",      icon: "👨‍🏫" },
  examiner:  { title: "Я экзаменатор",   icon: "📋" },
  applicant: { title: "Я абитуриент",     icon: "📝" },
};

function countLabel(role: AvailableRole, c: ContextsResponse): string {
  switch (role) {
    case "student": {
      const n = c.student.length;
      return n === 1 ? "1 программа" : `${n} программ`;
    }
    case "parent": {
      const n = c.parent.length;
      return n === 1 ? "1 ребёнок" : `${n} детей`;
    }
    case "teacher":   return "Расписание + проверка";
    case "examiner":  return c.examiner[0]?.event.title ?? "Комиссия";
    case "applicant": return c.applicant[0]?.application.direction ?? "Заявка";
  }
}

export function RoleSelector({ identity, contexts, available, onPick, onLogout }: Props) {
  const personIdLabel = usePersonIdLabel();
  return (
    <main id="main-content" className="min-h-screen flex flex-col bg-canvas px-4 py-8">
      <h1 className="sr-only">Выбор роли</h1>
      <div className="max-w-md mx-auto w-full">
        {/* Шапка */}
        <div className="mb-8 text-center">
          <div
            className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent text-white text-lg font-bold flex items-center justify-center"
            aria-hidden="true"
          >
            {identity.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
          </div>
          <div className="text-fg text-base font-semibold">{identity.name}</div>
          <div className="text-fg-muted text-xs mt-1">{personIdLabel} {identity.eiv}</div>
        </div>

        <div className="text-fg-dim text-[0.68rem] font-bold uppercase tracking-[0.06em] mb-3 text-center">
          В какой роли войти
        </div>

        {/* Кнопки ролей */}
        <div className="flex flex-col gap-2.5">
          {available.map(role => (
            <button
              key={role}
              onClick={() => onPick(role)}
              className="w-full text-left"
            >
              <Card className="px-4 py-4 flex items-center gap-3 cursor-pointer hover:border-accent transition-colors">
                <div className="text-2xl shrink-0">{ROLE_LABELS[role].icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-fg text-[0.95rem] font-medium">
                    {ROLE_LABELS[role].title}
                  </div>
                  <div className="text-fg-muted text-xs mt-0.5">
                    {countLabel(role, contexts)}
                  </div>
                </div>
                <div className="text-fg-dim text-xl shrink-0" aria-hidden="true">›</div>
              </Card>
            </button>
          ))}
        </div>

        {/* Выход */}
        <div className="mt-8 flex justify-center">
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Выйти
          </Button>
        </div>
      </div>
    </main>
  );
}
