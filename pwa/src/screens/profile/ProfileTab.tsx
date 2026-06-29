import { useState } from "react";
import type { Person, Learner } from "@eios/contracts";
import type { ThemeMode } from "../../theme.js";
import { ThemeIcon } from "../../components/icons/index.js";
import { getFontSize, setFontSize, FONT_SIZE_LABELS, type FontSize } from "../../fontSize.js";
import { useLocale, LOCALES, type Locale } from "../../locale.js";
import { Card } from "../../ui/Card.js";
import { Button } from "../../ui/Button.js";
import { Spinner } from "../../ui/Spinner.js";
import { useInstallPrompt } from "../../install.js";
import { useContexts } from "../../data/contexts.js";
import { clearRole, availableRoles } from "../../shell/contextSelection.js";
import { USE_MOCK } from "../../auth/mock.js";
import { useBranding } from "../../branding/useBranding.js";

interface Props {
  person:          Person;
  learner:         Learner;
  themeMode:       ThemeMode;
  onThemeChange:   (m: ThemeMode) => void;
  locale:          Locale;
  onLocaleChange:  (l: Locale) => void;
  lkUrl?:          string;
  onSwitchContext?: () => void;
  onLogout?:        () => void;
}

const SECTION_LABEL_CLS =
  "text-fg-dim text-[0.68rem] font-bold uppercase tracking-[0.06em] mb-2.5";
const FIELD_LABEL_CLS = "text-fg-muted text-[0.72rem] mb-0.5";
const OPTION_BTN_CLS =
  "flex items-center gap-1.5 border border-line rounded-lg px-3.5 py-2 " +
  "bg-surface text-fg-secondary text-[0.85rem] font-medium cursor-pointer";
const OPTION_ACTIVE_CLS =
  "border-accent text-accent bg-[color-mix(in_srgb,var(--c-accent)_10%,transparent)]";

export function ProfileTab({
  person, learner, themeMode, onThemeChange, locale, onLocaleChange,
  lkUrl, onSwitchContext, onLogout,
}: Props) {
  const { t } = useLocale();
  const THEMES: { value: ThemeMode; label: string }[] = [
    { value: "auto",  label: t("themeAuto") },
    { value: "light", label: t("themeLight") },
    { value: "dark",  label: t("themeDark") },
  ];

  // Если организация задала свой label в брендинге — он перекрывает t("eivFull")
  const branding = useBranding();
  const idLabel  = branding.personIdLabel?.trim() || t("eivFull");

  // Размер шрифта — accessibility-настройка (S/M/L → 14/16/18 px на root)
  const [fontSize, setFontSizeState] = useState<FontSize>(getFontSize);
  function handleFontSize(s: FontSize) { setFontSize(s); setFontSizeState(s); }

  return (
    <div>
      {/* ID физлица (ЕИВ по умолчанию, конфигурируемо через брендинг) */}
      <div className="mb-6">
        <div className={FIELD_LABEL_CLS}>{idLabel}</div>
        <div className="text-fg text-base font-semibold mt-1">{person.eiv}</div>
      </div>

      {/* Личные данные */}
      <div className="mb-6">
        <div className={SECTION_LABEL_CLS}>{t("personalInfo")}</div>
        {[
          { label: t("lastName"),   value: person.lastName  },
          { label: t("firstName"),  value: person.firstName  },
          { label: t("patronymic"), value: person.patronymic },
        ].filter(f => f.value).map(f => (
          <div key={f.label} className="mt-2.5">
            <div className={FIELD_LABEL_CLS}>{f.label}</div>
            <div className="text-fg text-[0.95rem] font-medium">{f.value}</div>
          </div>
        ))}
        {/* Read-only PD — править во внешнем ЛК организации */}
        {lkUrl && (
          <a
            href={lkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-accent text-xs mt-3 no-underline hover:underline"
          >
            Изменить в {branding.orgName} ↗
          </a>
        )}
      </div>

      {/* Текущий профиль обучения */}
      <div className="mb-6">
        <div className={SECTION_LABEL_CLS}>{t("learnProfile")}</div>
        <Card className="px-3.5 py-3">
          <div className="text-fg text-[0.88rem] font-semibold mb-1">
            {learner.programType} · {learner.programTitle}
          </div>
          <div className="text-fg-muted text-xs mt-0.5">
            {learner.group} · {learner.course} курс · {learner.form}
          </div>
          <div className="text-fg-muted text-xs mt-0.5">
            {learner.periodLabel}
          </div>
        </Card>
        {onSwitchContext && (
          <Button variant="secondary" size="md" className="w-full mt-2" onClick={onSwitchContext}>
            {t("switchProfile")}
          </Button>
        )}
      </div>

      {/* Перейти в ЛК */}
      {lkUrl && (
        <div className="mb-6">
          <a
            href={lkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-3 px-4 rounded-lg bg-accent text-white no-underline text-[0.88rem] font-semibold text-center"
          >
            {t("goToLk")}
          </a>
        </div>
      )}

      {/* Язык */}
      <div className="mb-6">
        <div className={SECTION_LABEL_CLS}>{t("language")}</div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {LOCALES.map(l => (
            <button
              key={l}
              className={locale === l ? `${OPTION_BTN_CLS} ${OPTION_ACTIVE_CLS}` : OPTION_BTN_CLS}
              onClick={() => onLocaleChange(l)}
            >
              {l === "ru" ? t("langRu") : l === "en" ? t("langEn") : t("langKk")}
            </button>
          ))}
        </div>
      </div>

      {/* Тема */}
      <div className="mb-6">
        <div className={SECTION_LABEL_CLS}>{t("theme")}</div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {THEMES.map(({ value, label }) => (
            <button
              key={value}
              className={themeMode === value ? `${OPTION_BTN_CLS} ${OPTION_ACTIVE_CLS}` : OPTION_BTN_CLS}
              onClick={() => onThemeChange(value)}
            >
              <ThemeIcon mode={value} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Размер шрифта (accessibility) */}
      <div className="mb-6">
        <div className={SECTION_LABEL_CLS}>Размер шрифта</div>
        <div className="flex gap-2 mt-2">
          {(["s","m","l"] as FontSize[]).map(s => (
            <button
              key={s}
              className={fontSize === s ? `${OPTION_BTN_CLS} ${OPTION_ACTIVE_CLS}` : OPTION_BTN_CLS}
              onClick={() => handleFontSize(s)}
              aria-label={`Размер шрифта ${FONT_SIZE_LABELS[s]}`}
              style={{ fontSize: s === "s" ? "0.78rem" : s === "l" ? "1.05rem" : "0.9rem" }}
            >
              {FONT_SIZE_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="text-fg-dim text-xs mt-2">
          Влияет на весь интерфейс. Удобно для слабовидящих.
        </div>
      </div>

      {/* Мои роли и контексты (из identity.contexts.get) */}
      <MyRolesSection />

      {/* Установка PWA */}
      <InstallSection />

      {/* Выход */}
      {onLogout && (
        <div className="mt-8">
          <Button variant="danger" size="lg" className="w-full" onClick={onLogout}>
            {t("logout")}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * MyRolesSection — отображает контексты физика из identity.contexts.get.
 * Block I §10 — будущий context-switcher (этап 6) использует те же данные,
 * сейчас просто список для проверки RPC.
 */
function MyRolesSection() {
  const { contexts, loading, error } = useContexts();
  const canSwitch = !USE_MOCK && contexts && availableRoles(contexts).length > 1;

  function switchRole() {
    clearRole();
    window.location.reload();   // AppShell перерендерится с RoleSelector
  }

  return (
    <div className="mb-6">
      <div className={SECTION_LABEL_CLS}>Мои роли</div>
      {loading && (
        <Card className="px-3.5 py-3 flex items-center gap-2 text-fg-muted text-sm">
          <Spinner /> Загрузка контекстов…
        </Card>
      )}
      {error && (
        <Card className="px-3.5 py-3 text-danger text-sm">
          Не удалось загрузить: {error}
        </Card>
      )}
      {contexts && !loading && !error && (
        <Card className="px-3.5 py-3">
          {contexts.student.map((c) => (
            <div key={c.context_id} className="py-1.5 border-b border-line last:border-0">
              <div className="text-fg text-[0.85rem] font-medium">
                Я (учусь) · {c.education_program.title}
              </div>
              <div className="text-fg-muted text-xs mt-0.5">
                {c.education_program.code} · {c.education_program.level} · {c.education_program.form} · {c.current_semester} семестр
              </div>
            </div>
          ))}
          {contexts.parent.map((c) => (
            <div key={c.context_id} className="py-1.5 border-b border-line last:border-0">
              <div className="text-fg text-[0.85rem] font-medium">
                Родитель · {c.child.name}
              </div>
              <div className="text-fg-muted text-xs mt-0.5">
                {c.child.education_program.title}
              </div>
            </div>
          ))}
          {contexts.teacher.map((c) => (
            <div key={c.context_id} className="py-1.5 border-b border-line last:border-0">
              <div className="text-fg text-[0.85rem] font-medium">Преподаваемые группы</div>
              <div className="text-fg-muted text-xs mt-0.5 font-mono">{c.context_id}</div>
            </div>
          ))}
          {contexts.examiner.map((c) => (
            <div key={c.context_id} className="py-1.5 border-b border-line last:border-0">
              <div className="text-fg text-[0.85rem] font-medium">Экзаменатор · {c.event.title}</div>
              <div className="text-fg-muted text-xs mt-0.5">{c.event.dates.from} — {c.event.dates.to}</div>
            </div>
          ))}
          {contexts.applicant.map((c) => (
            <div key={c.context_id} className="py-1.5 border-b border-line last:border-0">
              <div className="text-fg text-[0.85rem] font-medium">Абитуриент · {c.application.direction}</div>
              <div className="text-fg-muted text-xs mt-0.5">статус: {c.application.status}</div>
            </div>
          ))}
          {contexts.student.length === 0 && contexts.parent.length === 0 &&
           contexts.teacher.length === 0 && contexts.examiner.length === 0 &&
           contexts.applicant.length === 0 && (
            <div className="text-fg-muted text-sm py-1">Нет активных контекстов</div>
          )}
        </Card>
      )}
      {canSwitch && (
        <Button variant="ghost" size="sm" onClick={switchRole} className="mt-2 text-accent">
          ↩ Сменить роль
        </Button>
      )}
    </div>
  );
}

function InstallSection() {
  const { installed, canInstall, isIOS, install } = useInstallPrompt();
  if (installed) return null;

  if (canInstall) {
    return (
      <div className="mb-6">
        <div className={SECTION_LABEL_CLS}>Приложение</div>
        <Button variant="primary" size="lg" className="w-full" onClick={install}>
          📲 Установить на устройство
        </Button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="mb-6">
        <div className={SECTION_LABEL_CLS}>Приложение</div>
        <Card className="px-3.5 py-3">
          <div className="text-fg text-[0.85rem] font-medium mb-1">
            Установить на главный экран
          </div>
          <div className="text-fg-muted text-xs leading-relaxed">
            Нажмите кнопку «Поделиться» <span className="text-fg">⎙</span> внизу
            и выберите <span className="text-fg font-medium">«На экран „Домой"»</span>.
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
