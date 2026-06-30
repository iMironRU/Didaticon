/**
 * RouteAnnouncer — невидимая `aria-live` область, которая объявляет
 * заголовок экрана при каждой смене route.
 *
 * Без этого SPA-роутинг не сообщает скринридеру что страница сменилась
 * (нет full page reload, focus не двинулся). Спека a11y §5.3:
 *   «При client-side навигации скринридер не знает, что страница
 *    сменилась. Без явных мер незрячий пользователь теряет ориентацию».
 *
 * Альтернатива — переносить focus на <h1> нового экрана. Live-region менее
 * интрусивно (не двигает focus), достаточно для большинства SPA.
 *
 * `aria-live=polite` — не перебивает текущее чтение, дожидается паузы.
 * `aria-atomic=true` — читает текст целиком, не дельту.
 */
import { useEffect, useRef, useState } from "react";

interface Props {
  /** Уникальный идентификатор экрана (route.name + параметры). Смена → анонс. */
  routeKey: string;
  /** Текст, который будет прочитан скринридером. */
  message:  string;
}

export function RouteAnnouncer({ routeKey, message }: Props) {
  const [text, setText] = useState("");
  const prevKey = useRef(routeKey);
  const isFirst = useRef(true);

  useEffect(() => {
    // Первый рендер не объявляем — это начальная загрузка, скринридер
    // прочитает страницу сам.
    if (isFirst.current) {
      isFirst.current = false;
      prevKey.current = routeKey;
      return;
    }
    if (prevKey.current !== routeKey) {
      prevKey.current = routeKey;
      // Принудительная смена текста (очистка + установка) для AT, которые
      // не реагируют на повторно тот же контент.
      setText("");
      const t = setTimeout(() => setText(message), 50);
      return () => clearTimeout(t);
    }
  }, [routeKey, message]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {text}
    </div>
  );
}
