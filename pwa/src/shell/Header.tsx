import type { ReactNode } from "react";
import { LogoIcon, BellIcon, SwitchIcon } from "../components/icons/index.js";

declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__: string;

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
        <div className="flex flex-col leading-tight">
          <span className="text-fg text-[0.85rem] font-bold">ЭИОС</span>
          <span className="text-fg-dim text-[0.62rem]">
            {"v" + (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0")}
          </span>
          {typeof __COMMIT_HASH__ !== "undefined" && __COMMIT_HASH__ && (
            <span className="text-fg-dim text-[0.62rem]">{__COMMIT_HASH__}</span>
          )}
        </div>
      </div>
      {middle}
      {bell && (
        <button
          className="relative bg-transparent border-0 cursor-pointer text-fg-secondary p-1 shrink-0"
          onClick={bell.onTap}
          aria-label={bell.unreadCount > 0
            ? `Уведомления, ${bell.unreadCount} непрочитанных`
            : "Уведомления"}
        >
          <BellIcon />
          {bell.unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 bg-danger text-white rounded-full text-[0.55rem] font-bold min-w-[14px] h-[14px] flex items-center justify-center px-0.5"
              aria-hidden="true"
            >
              {bell.unreadCount > 9 ? "9+" : bell.unreadCount}
            </span>
          )}
        </button>
      )}
      {onAvatarTap
        ? <button
            className="bg-transparent border-0 p-0 cursor-pointer shrink-0 rounded-full"
            onClick={onAvatarTap}
            aria-label={`${initials} — Профиль`}
          >
            <div className={AVATAR_CLS} aria-hidden="true">{initials}</div>
          </button>
        : <div className={AVATAR_CLS} aria-hidden="true">{initials}</div>
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
        // Видимый текст ({programType} · {group}, {periodLabel}) идёт в начале —
        // WCAG 2.5.3 Label in Name.
        aria-label={`${programType} · ${group}, ${periodLabel}. Сменить контекст обучения`}
      >
        <div className="flex items-center gap-1.5 min-w-0" aria-hidden="true">
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
