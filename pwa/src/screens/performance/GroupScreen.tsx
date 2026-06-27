import type { CSSProperties } from "react";
import { useLocale } from "../../locale.js";
import type { UnitGroup, UnitLeaf } from "@eios/contracts";
import { UnitCard } from "./PerformanceTab.js";

interface Props {
  group:    UnitGroup;
  onBack:   () => void;
  onUnit:   (unit: UnitLeaf) => void;
}

export function GroupScreen({ group, onBack, onUnit }: Props) {
  const { t } = useLocale();
  return (
    <>
      <div style={st.subHeader}>
        <button style={st.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> {t("back")}
        </button>
        <div style={st.subHeaderTitle}>{group.code} · {group.title}</div>
      </div>

      <div style={{ ...st.body, paddingTop: 16 }}>
        {group.children.map(child => (
          <UnitCard
            key={child.unitId}
            unit={child}
            showCode
            onClick={() => onUnit(child)}
          />
        ))}
      </div>
    </>
  );
}

const st: Record<string, CSSProperties> = {
  subHeader:      { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--c-header)", borderBottom: "0.5px solid var(--c-border)", flexShrink: 0 },
  backBtn:        { background: "none", border: "none", color: "var(--c-accent)", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  subHeaderTitle: { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  body:           { flex: 1, padding: "12px 16px", overflowY: "auto" },
};
