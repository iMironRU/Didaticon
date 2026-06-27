import type { CSSProperties } from "react";
import type { Person, Learner } from "@eios/contracts";
import type { ThemeMode } from "../../theme.js";
import { ThemeIcon } from "../../components/icons/index.js";
import { useLocale } from "../../locale.js";

interface Props {
  person:          Person;
  learner:         Learner;
  themeMode:       ThemeMode;
  onThemeChange:   (m: ThemeMode) => void;
  locale:          "ru" | "en";
  onLocaleChange:  (l: "ru" | "en") => void;
  lkUrl?:          string;
  onSwitchContext?: () => void;
  onLogout?:        () => void;
}

export function ProfileTab({ person, learner, themeMode, onThemeChange, locale, onLocaleChange, lkUrl, onSwitchContext, onLogout }: Props) {
  const { t } = useLocale();
  const THEMES: { value: ThemeMode; label: string }[] = [
    { value: "auto",  label: t("themeAuto") },
    { value: "light", label: t("themeLight") },
    { value: "dark",  label: t("themeDark") },
  ];

  return (
    <div>
      {/* ЕИВ */}
      <div style={st.block}>
        <div style={st.fieldLabel}>{t("eivFull")}</div>
        <div style={st.eivValue}>{person.eiv}</div>
      </div>

      {/* Личные данные */}
      <div style={st.block}>
        <div style={st.sectionLabel}>{t("personalInfo")}</div>
        {[
          { label: t("lastName"),   value: person.lastName  },
          { label: t("firstName"),  value: person.firstName  },
          { label: t("patronymic"), value: person.patronymic },
        ].filter(f => f.value).map(f => (
          <div key={f.label} style={st.field}>
            <div style={st.fieldLabel}>{f.label}</div>
            <div style={st.fieldValue}>{f.value}</div>
          </div>
        ))}
      </div>

      {/* Текущий профиль обучения */}
      <div style={st.block}>
        <div style={st.sectionLabel}>{t("learnProfile")}</div>
        <div style={st.learnerCard}>
          <div style={st.learnerProgram}>{learner.programType} · {learner.programTitle}</div>
          <div style={st.learnerMeta}>{learner.group} · {learner.course} курс · {learner.form}</div>
          <div style={st.learnerMeta}>{learner.periodLabel}</div>
        </div>
        {onSwitchContext && (
          <button style={st.switchBtn} onClick={onSwitchContext}>
            {t("switchProfile")}
          </button>
        )}
      </div>

      {/* Перейти в ЛК */}
      {lkUrl && (
        <div style={st.block}>
          <a href={lkUrl} target="_blank" rel="noopener noreferrer" style={st.lkBtn}>
            {t("goToLk")}
          </a>
        </div>
      )}

      {/* Язык */}
      <div style={st.block}>
        <div style={st.sectionLabel}>{t("language")}</div>
        <div style={st.optionsRow}>
          {(["ru", "en"] as const).map(l => (
            <button
              key={l}
              style={{ ...st.optionBtn, ...(locale === l ? st.optionActive : {}) }}
              onClick={() => onLocaleChange(l)}
            >
              {l === "ru" ? t("langRu") : t("langEn")}
            </button>
          ))}
        </div>
      </div>

      {/* Тема */}
      <div style={st.block}>
        <div style={st.sectionLabel}>{t("theme")}</div>
        <div style={st.optionsRow}>
          {THEMES.map(({ value, label }) => (
            <button
              key={value}
              style={{ ...st.optionBtn, ...(themeMode === value ? st.optionActive : {}) }}
              onClick={() => onThemeChange(value)}
            >
              <ThemeIcon mode={value} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Выход */}
      {onLogout && (
        <div style={{ marginTop: 32 }}>
          <button style={st.logoutBtn} onClick={onLogout}>{t("logout")}</button>
        </div>
      )}
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  block:          { marginBottom: 24 },
  sectionLabel:   { color: "var(--c-text-dim)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10 },
  field:          { marginTop: 10 },
  fieldLabel:     { color: "var(--c-text-muted)", fontSize: "0.72rem", marginBottom: 2 },
  fieldValue:     { color: "var(--c-text-primary)", fontSize: "0.95rem", fontWeight: 500 },
  eivValue:       { color: "var(--c-text-primary)", fontSize: "1rem", fontWeight: 600, marginTop: 4 },
  learnerCard:    { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px 14px" },
  learnerProgram: { color: "var(--c-text-primary)", fontSize: "0.88rem", fontWeight: 600, marginBottom: 4 },
  learnerMeta:    { color: "var(--c-text-muted)", fontSize: "0.75rem", marginTop: 2 },
  switchBtn:      { width: "100%", marginTop: 8, border: "1px solid var(--c-border)", borderRadius: 8, background: "none", color: "var(--c-text-secondary)", fontSize: "0.85rem", fontWeight: 500, padding: "10px 0", cursor: "pointer" },
  lkBtn:          { display: "block", padding: "11px 16px", borderRadius: 10, background: "var(--c-accent)", color: "#fff", textDecoration: "none", fontSize: "0.88rem", fontWeight: 600, textAlign: "center" as const },
  optionsRow:     { display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" as const },
  optionBtn:      { display: "flex", alignItems: "center", gap: 5, border: "1px solid var(--c-border)", borderRadius: 8, padding: "8px 14px", background: "var(--c-card)", color: "var(--c-text-secondary)", fontSize: "0.85rem", cursor: "pointer", fontWeight: 500 },
  optionActive:   { borderColor: "var(--c-accent)", color: "var(--c-accent)", background: "color-mix(in srgb, var(--c-accent) 10%, transparent)" },
  logoutBtn:      { width: "100%", border: "1px solid var(--c-danger)", borderRadius: 10, padding: "13px 0", background: "none", color: "var(--c-danger)", fontSize: "0.95rem", cursor: "pointer", fontWeight: 600 },
};
