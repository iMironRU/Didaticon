/**
 * SkipLink — невидимая до фокуса ссылка «Перейти к основному содержимому».
 * Первый focusable элемент в Tab-order, скринридер/клавиатура её сразу находит.
 *
 * При активации (Enter) переводит фокус на `<main id="main-content">`.
 * Источник: didakticon-accessibility.md §5.1 + WCAG 2.4.1 Bypass Blocks (A).
 */

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={
        "sr-only focus:not-sr-only " +
        "focus:absolute focus:top-2 focus:left-2 focus:z-50 " +
        "focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-white " +
        "focus:text-sm focus:font-medium focus:outline-none " +
        "focus:ring-2 focus:ring-white focus:ring-offset-2"
      }
    >
      Перейти к основному содержимому
    </a>
  );
}
