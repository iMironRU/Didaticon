import { useState } from "react";
import { useLocale } from "../../locale.js";
import type { CSSProperties } from "react";
import type { Person, Learner } from "@eios/contracts";

interface Props {
  person:      Person;
  learners:    Learner[];
  currentId:   string;  // learnerId
  defaultId:   string;  // learnerId
  onSelect:    (learnerId: string) => void;
  onSetDefault:(learnerId: string) => void;
}

export function ContextSwitcherScreen({ person, learners, currentId, defaultId, onSelect, onSetDefault }: Props) {
  const { t } = useLocale();
  const [localDefault, setLocalDefault] = useState(defaultId);

  function handleSetDefault(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setLocalDefault(id);
    onSetDefault(id);
  }

  const title = person.personType === "parent" ? t("myChildren") : t("learnersTitle");

  return (
    <div style={{ ...st.body, paddingTop: 16, flex: 1 }}>
      <div style={st.sectionLabel}>{title}</div>
      {learners.map(learner => {
        const isCurrent  = learner.learnerId === currentId;
        const isDefault  = learner.learnerId === localDefault;
        return (
          <div
            key={learner.learnerId}
            style={{ ...st.ctxCard, ...(isCurrent ? st.ctxCardActive : {}) }}
            onClick={() => onSelect(learner.learnerId)}
          >
            <div style={st.ctxHead}>
              <span style={st.ctxTypeBadge}>{learner.programType}</span>
              {isDefault  && <span style={st.ctxDefaultBadge}>{t("defaultBadge")}</span>}
              {isCurrent  && <span style={st.ctxCheck}>✓</span>}
            </div>
            <div style={st.ctxName}>{learner.programTitle}</div>
            <div style={st.ctxPeriod}>{learner.group} · {learner.periodLabel}</div>
            <button
              style={{ ...st.ctxSetDefaultBtn, ...(isDefault ? { visibility: "hidden" as const } : {}) }}
              onClick={e => handleSetDefault(learner.learnerId, e)}
            >
              {t("setAsDefault")}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  body:            { flex: 1, padding: "12px 16px", overflowY: "auto" },
  sectionLabel:    { color: "var(--c-text-dim)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 10 },
  ctxCard:         { background: "var(--c-card)", border: "0.5px solid var(--c-border)", borderRadius: 12, padding: "14px 16px", marginBottom: 10, cursor: "pointer" },
  ctxCardActive:   { borderColor: "var(--c-accent)", background: "color-mix(in srgb, var(--c-accent) 6%, var(--c-card))" },
  ctxHead:         { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 },
  ctxTypeBadge:    { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em", background: "var(--c-border)", color: "var(--c-text-muted)", borderRadius: 4, padding: "2px 6px" },
  ctxDefaultBadge: { fontSize: "0.65rem", fontWeight: 600, background: "color-mix(in srgb, var(--c-accent) 12%, transparent)", color: "var(--c-accent)", borderRadius: 4, padding: "2px 6px" },
  ctxCheck:        { marginLeft: "auto", color: "var(--c-accent)", fontWeight: 700 },
  ctxName:         { color: "var(--c-text-primary)", fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.3, marginBottom: 3 },
  ctxPeriod:       { color: "var(--c-text-muted)", fontSize: "0.75rem" },
  ctxSetDefaultBtn:{ border: "none", background: "none", color: "var(--c-accent)", fontSize: "0.75rem", cursor: "pointer", marginTop: 8, padding: 0 },
};
