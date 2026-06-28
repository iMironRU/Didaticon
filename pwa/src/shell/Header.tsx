import type { ReactNode } from "react";
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

const AVATAR_CLS =
  "w-7 h-7 rounded-full bg-accent text-white text-[0.65rem] font-bold " +
  "flex items-center justify-center shrink-0";

export function Header({ middle, initials, onAvatarTap, bell }: Props) {
  return (
    <header className="flex items-center gap-2 px-3.5 py-2.5 bg-elevated border-b border-line shrink-0">
      <div className="flex items-center gap-1.5 shrink-0">
        <LogoIcon />
        <span className="text-fg text-[0.85rem] font-bold">ЭИОС</span>
      </div>
      {middle}
      {bell && (
        <button
          className="relative bg-transparent border-0 cursor-pointer text-fg-secondary p-1 shrink-0"
          onClick={bell.onTap}
        >
          <BellIcon />
          {bell.unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-danger text-white rounded-full text-[0.55rem] font-bold min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
              {bell.unreadCount > 9 ? "9+" : bell.unreadCount}
            </span>
          )}
        </button>
      )}
      {onAvatarTap
        ? <button
            className="bg-transparent border-0 p-0 cursor-pointer shrink-0 rounded-full"
            onClick={onAvatarTap}
          >
            <div className={AVATAR_CLS}>{initials}</div>
          </button>
        : <div className={AVATAR_CLS}>{initials}</div>
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
    <div className="min-w-0 overflow-hidden text-left flex-1">
      <div className="block text-fg text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
        {programType} · {group}
      </div>
      <div className="block text-fg-muted text-[0.62rem] whitespace-nowrap">
        {periodLabel}
      </div>
    </div>
  );
  if (onTap) {
    return (
      <button
        className="flex-1 min-w-0 bg-transparent border-0 px-2 py-1 rounded-lg cursor-pointer"
        onClick={onTap}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {inner}
          <SwitchIcon />
        </div>
      </button>
    );
  }
  return (
    <div className="flex-1 min-w-0 bg-transparent px-2 py-1 rounded-lg">
      {inner}
    </div>
  );
}

/** Готовый middle-блок: статичный label (например, «Педагог» или «Мои дети»). */
export function ContextLabel({ text }: { text: string }) {
  return (
    <div className="flex-1 min-w-0 px-2 py-1 rounded-lg cursor-default">
      <span className="block text-fg text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap">
        {text}
      </span>
    </div>
  );
}
