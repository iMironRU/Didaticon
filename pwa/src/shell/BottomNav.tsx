import type { CSSProperties, ReactNode } from "react";

export interface BottomNavTab {
  id:      string;
  label:   string;
  icon:    ReactNode;
  /** Бейдж с числом (долги, новые уведомления) */
  badge?:  number;
}

interface Props {
  tabs:     BottomNavTab[];
  activeId: string;
  onTap:    (id: string) => void;
}

export function BottomNav({ tabs, activeId, onTap }: Props) {
  return (
    <nav style={st.nav}>
      {tabs.map(it => {
        const active = it.id === activeId;
        const color = active ? "var(--c-accent)" : "var(--c-text-dim)";
        return (
          <button key={it.id} style={st.item} onClick={() => onTap(it.id)}>
            <span style={{ position: "relative", display: "inline-flex", color }}>
              {it.icon}
              {it.badge != null && it.badge > 0 && (
                <span style={st.badge}>{it.badge > 9 ? "9+" : it.badge}</span>
              )}
            </span>
            <span style={{ ...st.label, color }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const st: Record<string, CSSProperties> = {
  nav:   { background: "var(--c-header)", borderTop: "0.5px solid var(--c-border)", display: "flex", padding: "6px 0 10px", flexShrink: 0 },
  item:  { flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3, padding: "4px 0" },
  label: { fontSize: "0.62rem", fontWeight: 500 },
  badge: { position: "absolute" as const, top: -3, right: -6, background: "var(--c-danger)", color: "#fff", borderRadius: "50%", fontSize: "0.55rem", fontWeight: 700, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" },
};
