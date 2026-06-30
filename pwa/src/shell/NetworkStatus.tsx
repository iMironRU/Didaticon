/**
 * NetworkStatus — UI для смены online↔offline (docs/didakticon-online-offline.md §9).
 *
 *  - Когда `!online` показывает sticky-баннер «Нет сети. Часть функций недоступна»
 *    под Header. Скринридеру объявляется через `role="status"` + `aria-live`.
 *  - При transition offline → online — кратковременный тост «✓ Сеть восстановлена»
 *    на 3 секунды.
 *
 * Mount в UnifiedShell — виден на всех экранах поверх контента.
 */
import { useEffect, useRef, useState } from "react";
import { useOnline } from "../useOnline.js";

export function NetworkStatus() {
  const online = useOnline();
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const prevOnline = useRef(online);

  useEffect(() => {
    // Transition offline → online → показываем тост 3 сек
    if (!prevOnline.current && online) {
      setShowRestoredToast(true);
      const t = setTimeout(() => setShowRestoredToast(false), 3000);
      return () => clearTimeout(t);
    }
    prevOnline.current = online;
  }, [online]);

  return (
    <>
      {!online && (
        <div
          role="status"
          aria-live="polite"
          className="w-full px-4 py-2 text-[0.78rem] font-medium text-center shrink-0"
          style={{ background: "#FDE68A", color: "#78350F", borderBottom: "1px solid #FCD34D" }}
        >
          <span aria-hidden="true">⚡</span> Нет сети. Часть функций недоступна.
        </div>
      )}
      {showRestoredToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-success text-white text-sm font-medium shadow-lg animate-fade-in"
        >
          <span aria-hidden="true">✓</span> Сеть восстановлена
        </div>
      )}
    </>
  );
}
