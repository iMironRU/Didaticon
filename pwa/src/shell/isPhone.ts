/**
 * Возвращает true, если пользователь на телефоне.
 * Два сигнала:
 *  1. standalone — PWA установлена (нет кнопки «обновить» в браузере)
 *  2. coarse pointer + узкий экран — мобильный браузер на телефоне (не планшет)
 */
export function isPhone(): boolean {
  if (typeof window === "undefined") return false;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as Record<string, unknown>).standalone === true; // iOS Safari
  const smallTouch = window.matchMedia(
    "(pointer: coarse) and (max-width: 640px)"
  ).matches;
  return standalone || smallTouch;
}
