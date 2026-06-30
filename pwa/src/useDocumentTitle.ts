/**
 * useDocumentTitle — обновляет `document.title` per route.
 *
 * Без этого SPA не сообщает скринридеру и истории браузера об изменении
 * страницы — все screens называются «ЭИОС» в табе и AT.
 *
 * Формат: «ЭИОС · {заголовок}» / «ЭИОС · Дидактикон» для корня.
 * Источник: a11y политика §5.3, WCAG 2.4.2 Page Titled (A).
 */
import { useEffect } from "react";

const BASE = "ЭИОС";

export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ? `${BASE} · ${title}` : BASE;
  }, [title]);
}
