/**
 * usePullToRefresh — свайп вниз для обновления (issue #6).
 *
 * Жест дублирует кнопку "Обновить" (didakticon_design.md §1: "Gestures
 * дублируются кнопками — свайп ускоритель, не единственный путь"), не
 * заменяет её. Слушает touch-события на #main-content (единственный
 * скролл-контейнер контента — landmark из UnifiedShell/MainContent),
 * срабатывает только когда он в самом верху (scrollTop === 0), иначе это
 * был бы обычный скролл списка карточек, а не намерение потянуть экран.
 */
import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70; // px — потянуть настолько, чтобы отпускание триггерило refresh
const MAX_PULL   = 100; // визуальный потолок — дальше палец тянет, а индикатор не растёт

export interface PullToRefreshState {
  pullDistance: number;
  refreshing:   boolean;
  ready:        boolean; // pullDistance перевалил THRESHOLD — "отпустите для обновления"
}

export function usePullToRefresh(onRefresh: () => void, enabled: boolean): PullToRefreshState {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  // Обновляем ПОСЛЕ рендера (не во время) — react-hooks/refs требует useEffect,
  // не запись в .current прямо в теле компонента.
  useEffect(() => { onRefreshRef.current = onRefresh; });

  useEffect(() => {
    if (!enabled) return;
    const scrollEl = document.getElementById("main-content");
    if (!scrollEl) return;

    function onTouchStart(e: TouchEvent) {
      startY.current = scrollEl!.scrollTop === 0 ? e.touches[0].clientY : null;
    }
    function onTouchMove(e: TouchEvent) {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      const next = dy <= 0 ? 0 : Math.min(MAX_PULL, dy * 0.5); // damping — тяжелее тянуть дальше
      distanceRef.current = next;
      setPullDistance(next);
    }
    function onTouchEnd() {
      if (startY.current === null) return;
      if (distanceRef.current >= THRESHOLD) {
        setRefreshing(true);
        onRefreshRef.current();
        // useSwrCache сам не сообщает когда закончил — держим спиннер
        // короткую фиксированную паузу, достаточную для визуального фидбека.
        setTimeout(() => setRefreshing(false), 600);
      }
      distanceRef.current = 0;
      startY.current = null;
      setPullDistance(0);
    }

    scrollEl.addEventListener("touchstart", onTouchStart, { passive: true });
    scrollEl.addEventListener("touchmove", onTouchMove, { passive: true });
    scrollEl.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      scrollEl.removeEventListener("touchstart", onTouchStart);
      scrollEl.removeEventListener("touchmove", onTouchMove);
      scrollEl.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled]);

  return { pullDistance, refreshing, ready: pullDistance >= THRESHOLD };
}
