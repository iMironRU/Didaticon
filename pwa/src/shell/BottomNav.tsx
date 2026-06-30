import type { ReactNode } from "react";

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
    <nav
      className="flex pt-1.5 pb-2.5 bg-elevated border-t border-line shrink-0"
      aria-label="Основная навигация"
    >
      {tabs.map(it => {
        const active = it.id === activeId;
        // Inactive вкладки — text-fg-muted (4.5:1+ на bg-elevated в обеих темах).
        // Раньше text-fg-dim (3.x:1) — fail contrast §7.6 для tiny текста.
        const colorCls = active ? "text-accent" : "text-fg-muted";
        const ariaLabel = it.badge != null && it.badge > 0
          ? `${it.label}, ${it.badge} новых`
          : it.label;
        return (
          <button
            key={it.id}
            className="flex-1 flex flex-col items-center gap-[3px] bg-transparent border-0 py-1 cursor-pointer"
            onClick={() => onTap(it.id)}
            aria-label={ariaLabel}
            aria-current={active ? "page" : undefined}
          >
            <span className={`relative inline-flex ${colorCls}`} aria-hidden="true">
              {it.icon}
              {it.badge != null && it.badge > 0 && (
                <span className="absolute -top-[3px] -right-1.5 bg-danger text-white rounded-full text-[0.55rem] font-bold min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                  {it.badge > 9 ? "9+" : it.badge}
                </span>
              )}
            </span>
            <span className={`text-[0.62rem] font-medium ${colorCls}`} aria-hidden="true">
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
