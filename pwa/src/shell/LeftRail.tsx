import { type NavTab, navAriaLabel, NavIcon } from "./navTab.js";

interface Props {
  tabs:     NavTab[];
  activeId: string;
  onTap:    (id: string) => void;
}

/** Десктопный аналог BottomNav (≥768px) — та же навигация, вертикальная
 *  панель слева вместо таб-бара снизу. См. didakticon_design.md §12. */
export function LeftRail({ tabs, activeId, onTap }: Props) {
  return (
    <nav
      className="hidden md:flex flex-col w-20 shrink-0 py-3 gap-1 bg-elevated border-r border-line overflow-y-auto"
      aria-label="Основная навигация"
    >
      {tabs.map(it => {
        const active = it.id === activeId;
        const colorCls = active ? "text-accent" : "text-fg-muted";
        return (
          <button
            key={it.id}
            className="flex flex-col items-center gap-1 bg-transparent border-0 py-2.5 cursor-pointer"
            onClick={() => onTap(it.id)}
            aria-label={navAriaLabel(it)}
            aria-current={active ? "page" : undefined}
          >
            <NavIcon icon={it.icon} badge={it.badge} colorClass={colorCls} />
            <span className={`text-[0.62rem] font-medium ${colorCls}`} aria-hidden="true">
              {it.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
