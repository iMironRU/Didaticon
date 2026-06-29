/**
 * Размер шрифта — accessibility-настройка для людей с ограниченными возможностями
 * ([[feedback-accessibility]]). Меняет root font-size, все rem/em-размеры
 * в Tailwind масштабируются автоматически.
 *
 * S / M / L = 14 / 16 / 18 px. Сохраняется в localStorage, применяется ДО React
 * через inline-скрипт в index.html (избегаем FOUC при кастомном размере).
 */

export type FontSize = "s" | "m" | "l";

const KEY = "eios_font_size";
const PX: Record<FontSize, string> = { s: "14px", m: "16px", l: "18px" };

export function getFontSize(): FontSize {
  const v = localStorage.getItem(KEY);
  return (v === "s" || v === "m" || v === "l") ? v : "m";
}

export function setFontSize(size: FontSize): void {
  localStorage.setItem(KEY, size);
  document.documentElement.style.fontSize = PX[size];
}

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  s: "S",
  m: "M",
  l: "L",
};
