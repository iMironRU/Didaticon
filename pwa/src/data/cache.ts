/**
 * SWR-кеш (Stale-While-Revalidate) поверх localStorage.
 *
 * Единый паттерн для всех будущих RPC: показываем кешированные данные сразу,
 * в фоне обновляем. На сетевую ошибку — оставляем кеш, помечаем stale.
 *
 * Документация: docs/didakticon-online-offline.md §4.2 OFFLINE WITH CACHE.
 *
 * Пример:
 *   const { data, fetchedAt, stale, error } = useSwrCache({
 *     key:     "feed_cache_v1",
 *     fetcher: () => rpc<Feed>("feed.get"),
 *   });
 *
 * fetchedAt → UI показывает «Обновлено N мин назад» через formatRelativeTime().
 * stale=true → показать индикатор «офлайн» / «кеш».
 */
import { useEffect, useState } from "react";
import { RpcError } from "./rpc.js";

interface Stored<T> {
  data:       T;
  fetchedAt:  number;  // unix ms
}

export interface SwrState<T> {
  data:       T | null;
  fetchedAt:  number | null;
  loading:    boolean;
  /** true если показываем кеш, а свежий запрос упал. UI индикатор «офлайн». */
  stale:      boolean;
  /** Заполнен только когда кеша вообще нет И свежий запрос упал. */
  error:      string | null;
  /** true → error вызван просрочкой токена (RpcError code -32001). UI должен
   *  предложить «Войти снова» вместо голого текста ошибки. */
  isAuthError: boolean;
}

function readLs<T>(key: string): Stored<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Stored<T>;
  } catch { return null; }
}

function writeLs<T>(key: string, value: Stored<T>): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota / private */ }
}

export function clearLsCache(key: string): void {
  try { localStorage.removeItem(key); } catch { /* */ }
}

interface Options<T> {
  /** Ключ localStorage. Включай версию для миграции схемы (`_v1`). */
  key:     string;
  /** Функция загрузки. Должна бросать ошибку при сбое. */
  fetcher: () => Promise<T>;
  /** false → не читаем LS и не фетчим (например, demo-режим). */
  enabled?: boolean;
}

/**
 * useSwrCache — hook-обёртка.
 *
 * Жизненный цикл:
 *  1. Mount → читаем LS синхронно. Если есть — сразу возвращаем data со
 *     stale=true (показываем, но пометим как кеш-данные).
 *  2. Mount → фоновый fetcher().
 *  3. Успех → обновили LS, state{stale:false, fetchedAt: now}.
 *  4. Ошибка → если data был — оставили, stale=true. Если не было — error.
 */
export function useSwrCache<T>({ key, fetcher, enabled = true }: Options<T>): SwrState<T> {
  const [state, setState] = useState<SwrState<T>>(() => {
    if (!enabled) {
      return { data: null, fetchedAt: null, loading: false, stale: false, error: null, isAuthError: false };
    }
    const ls = readLs<T>(key);
    if (ls) {
      return { data: ls.data, fetchedAt: ls.fetchedAt, loading: false, stale: true, error: null, isAuthError: false };
    }
    return { data: null, fetchedAt: null, loading: true, stale: false, error: null, isAuthError: false };
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (cancelled) return;
        const fetchedAt = Date.now();
        writeLs<T>(key, { data, fetchedAt });
        setState({ data, fetchedAt, loading: false, stale: false, error: null, isAuthError: false });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        const isAuthError = e instanceof RpcError && e.code === -32001;
        setState((prev) => prev.data
          ? { ...prev, stale: true, loading: false, error: null, isAuthError: false }
          : { data: null, fetchedAt: null, loading: false, stale: false, error: msg, isAuthError }
        );
      });
    return () => { cancelled = true; };
    // fetcher не в deps — функция меняется на каждом рендере, deps по key+enabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return state;
}

/** Форматирование «обновлено N мин назад» для бейджа stale. */
export function formatRelativeTime(fetchedAt: number | null, now: number = Date.now()): string {
  if (fetchedAt === null) return "—";
  const sec = Math.floor((now - fetchedAt) / 1000);
  if (sec < 60)         return "только что";
  if (sec < 60 * 60)    return `${Math.floor(sec / 60)} мин назад`;
  if (sec < 24 * 3600)  return `${Math.floor(sec / 3600)} ч назад`;
  return `${Math.floor(sec / 86400)} дн назад`;
}
