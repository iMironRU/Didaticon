/**
 * Input — обёртка нативного <input> с темизацией ЭИОС.
 *
 * Без Radix — нативный input + accessibility уже встроены в HTML.
 * Семантические токены: bg-canvas, border-line, text-fg, placeholder-fg-dim.
 *
 * Использование с label (рекомендуется):
 *   <label className="block">
 *     <span className="text-fg-muted text-xs">Email</span>
 *     <Input type="email" name="email" />
 *   </label>
 */
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/utils.js";

/**
 * Высота h-11 = 44px (политика §7.6 hit-target).
 *
 * Accessibility:
 *  - Используйте `<label>` обёртку или `aria-label` (placeholder НЕ заменяет label,
 *    исчезает при вводе — у людей с когнитивными особенностями теряется контекст)
 *  - `aria-describedby="error-id"` для связи с описанием ошибки рядом
 *  - `autocomplete` атрибут для menager'ов паролей (важно для людей с моторикой
 *    и памятью)
 *  - Paste в `type="password"` не блокируется (WCAG 3.3.8 AA Accessible Auth)
 */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-11 w-full px-3 py-2 text-sm",
        "bg-canvas border border-line rounded-md text-fg",
        "placeholder:text-fg-dim",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
