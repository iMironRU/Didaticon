/**
 * Button — первый компонент UI-кита, паттерн для всех последующих.
 *
 * Архитектура (shadcn/ui style):
 *  1. cva()  — variants как декларативная конфигурация
 *  2. cn()   — мерж класс-нэймов, корректно разруливает конфликты Tailwind
 *  3. forwardRef + React.ButtonHTMLAttributes — полная type-safety нативной кнопки
 *  4. Использует СЕМАНТИЧЕСКИЕ Tailwind токены (bg-accent, text-fg) — палитру
 *     можно менять без правки этого файла.
 *
 * См. memory: architecture.md → правило 6.
 */
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils.js";

const buttonVariants = cva(
  // База: layout, типографика, фокус, disabled
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-colors cursor-pointer " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
  "disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:   "bg-accent text-white hover:opacity-90",
        secondary: "bg-surface text-fg border border-line hover:bg-elevated",
        ghost:     "bg-transparent text-fg-secondary hover:bg-surface",
        danger:    "bg-transparent text-danger border border-danger hover:bg-danger/10",
      },
      size: {
        // sm — узкое исключение для chip-групп (тема/язык/шрифт) и
        // секундарных мелких ссылок. Не для основных CTA.
        sm: "h-7 px-3 text-xs",
        // md — дефолт. 44px = минимум по политике §7.6 (тап-цель).
        md: "h-11 px-4 text-sm",
        // lg — для основных CTA (login, primary actions).
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size:    "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
