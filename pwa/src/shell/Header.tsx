import type { CSSProperties, ReactNode } from "react";
import { LogoIcon, BellIcon, SwitchIcon } from "../components/icons/index.js";

interface Props {
  /** Что показывается между логотипом и правым блоком — контекст ученика или role-label педагога */
  middle:         ReactNode;
  /** Инициалы аватара (BB, ПИ, ИИ) */
  initials:       string;
  /** Опционально — клик по аватару (если задан, аватар становится кнопкой) */
  onAvatarTap?:   () => void;
  /** Опционально — показать колокол уведомлений */
  bell?: {
    unreadCount:  number;
    onTap:        () => void;
  };
}

export function Header({ middle, initials, onAvatarTap, bell }: Props) {
  return (
    <header style={st.header}>
      <div style={st.headerLogo}>
        <LogoIcon />
        <span style={st.headerTitle}>ЭИОС</span>
      </div>
      {middle}
      {bell && (
        <button style={st.bellBtn} onClick={bell.onTap}>
          <BellIcon />
          {bell.unreadCount > 0 && (
            <span style={st.bellBadge}>{bell.unreadCount > 9 ? "9+" : bell.unreadCount}</span>
          )}
        </button>
      )}
      {onAvatarTap
        ? <button style={st.avatarBtn} onClick={onAvatarTap}>
            <div style={st.avatar}>{initials}</div>
          </button>
        : <div style={st.avatar}>{initials}</div>
      }
    </header>
  );
}

/** Готовый middle-блок: переключатель контекста учения (студент/родитель). */
export function ContextSwitcher({ programType, group, periodLabel, onTap }: {
  programType: string;
  group:       string;
  periodLabel: string;
  onTap?:      () => void;
}) {
  const inner = (
    <div style={{ minWidth: 0, overflow: "hidden", textAlign: "left" as const, flex: 1 }}>
      <div style={st.contextName}>{programType} · {group}</div>
      <div style={st.contextPeriod}>{periodLabel}</div>
    </div>
  );
  if (onTap) {
    return (
      <button style={st.contextBtn} onClick={onTap}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
          {inner}
          <SwitchIcon />
        </div>
      </button>
    );
  }
  return <div style={st.contextBtn}>{inner}</div>;
}

/** Готовый middle-блок: статичный label (например, «Педагог» или «Мои дети»). */
export function ContextLabel({ text }: { text: string }) {
  return (
    <div style={{ ...st.contextBtn, cursor: "default" as CSSProperties["cursor"] }}>
      <span style={st.contextName}>{text}</span>
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  header:       { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--c-header)", borderBottom: "0.5px solid var(--c-border)", flexShrink: 0 },
  headerLogo:   { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  headerTitle:  { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 700 },
  contextBtn:   { flex: 1, minWidth: 0, background: "none", border: "none", padding: "4px 8px", borderRadius: 8, cursor: "pointer" },
  contextName:  { color: "var(--c-text-primary)", fontSize: "0.75rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, display: "block" },
  contextPeriod:{ color: "var(--c-text-muted)", fontSize: "0.62rem", whiteSpace: "nowrap" as const, display: "block" },
  bellBtn:      { position: "relative" as const, background: "none", border: "none", cursor: "pointer", color: "var(--c-text-secondary)", padding: 4, flexShrink: 0 },
  bellBadge:    { position: "absolute" as const, top: 0, right: 0, background: "var(--c-danger)", color: "#fff", borderRadius: "50%", fontSize: "0.55rem", fontWeight: 700, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" },
  avatarBtn:    { background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0, borderRadius: "50%" },
  avatar:       { width: 28, height: 28, borderRadius: "50%", background: "var(--c-accent)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
};
