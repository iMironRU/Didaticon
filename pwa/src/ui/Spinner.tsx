/**
 * Spinner — анимированный SVG-loader.
 *
 * Без Radix, без зависимостей. Использует Tailwind `animate-spin`
 * (rotate 360deg 1s linear infinite — встроено в Tailwind).
 *
 * color: currentColor — наследует от родителя (используйте text-* класс
 * на родителе, например <Spinner /> внутри <Button> наследует белый цвет).
 *
 * Использование:
 *   <Spinner />
 *   <Spinner size={24} />
 *   <span className="text-accent"><Spinner size={20} /></span>
 */
import type { CSSProperties } from "react";
import { cn } from "../lib/utils.js";

interface Props {
  size?:      number;
  className?: string;
  style?:     CSSProperties;
}

export function Spinner({ size = 16, className, style }: Props) {
  return (
    <svg
      className={cn("animate-spin shrink-0", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
