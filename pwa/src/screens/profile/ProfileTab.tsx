import type { Person, Learner } from "@eios/contracts";
import type { ThemeMode } from "../../theme.js";
import { ThemeIcon } from "../../components/icons/index.js";
import { useLocale, LOCALES, type Locale } from "../../locale.js";
import { Card } from "../../ui/Card.js";
import { useInstallPrompt } from "../../install.js";

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

  return (
    <div>
      {/* ЕИВ */}
      <div className="mb-6">
        <div className={FIELD_LABEL_CLS}>{t("eivFull")}</div>
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
          <button
            className="w-full mt-2 border border-line rounded-lg bg-transparent text-fg-secondary text-[0.85rem] font-medium py-2.5 cursor-pointer"
            onClick={onSwitchContext}
          >
            {t("switchProfile")}
          </button>
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

      {/* Установка PWA */}
      <InstallSection />

      {/* Выход */}
      {onLogout && (
        <div className="mt-8">
          <button
            className="w-full border border-danger rounded-lg py-3 bg-transparent text-danger text-[0.95rem] font-semibold cursor-pointer"
            onClick={onLogout}
          >
            {t("logout")}
          </button>
        </div>
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
        <button
          className="w-full bg-accent text-white rounded-lg py-3 font-semibold text-[0.88rem] cursor-pointer"
          onClick={install}
        >
          📲 Установить на устройство
        </button>
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
