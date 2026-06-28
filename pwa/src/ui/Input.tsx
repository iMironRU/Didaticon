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

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-10 w-full px-3 py-2 text-sm",
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
