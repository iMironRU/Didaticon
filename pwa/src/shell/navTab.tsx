import type { ReactNode } from "react";

/** Общий тип пункта навигации — используется и в BottomNav (мобиль), и в LeftRail (десктоп). */
export interface NavTab {
  id:     string;
  label:  string;
  icon:   ReactNode;
  /** Бейдж с числом (долги, новые уведомления) */
  badge?: number;
}

export function navAriaLabel(tab: Pick<NavTab, "label" | "badge">): string {
  return tab.badge != null && tab.badge > 0
    ? `${tab.label}, ${tab.badge} новых`
    : tab.label;
}

/** Иконка + бейдж — идентичны в BottomNav и LeftRail, различается только раскладка контейнера вокруг. */
export function NavIcon({ icon, badge, colorClass }: { icon: ReactNode; badge?: number; colorClass: string }) {
  return (
    <span className={`relative inline-flex ${colorClass}`} aria-hidden="true">
      {icon}
      {badge != null && badge > 0 && (
        <span className="absolute -top-[3px] -right-1.5 bg-danger text-white rounded-full text-[0.55rem] font-bold min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </span>
  );
}
