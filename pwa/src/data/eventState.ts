/**
 * event.get / event.state — Block III §4, §15.1, §17.4 (issue #80).
 *
 * useEvent() — полная карточка события, SWR-кеш (та же семантика что и
 * feed.get в TodayScreen — см. docs/didakticon-online-offline.md §4.2).
 *
 * useEventStatePoll() — только состояние, авто-обновление раз в 60с (§17.4)
 * + ручной refresh(). Используется там, где не нужна вся карточка (напр.
 * бейдж состояния), либо как базовый строительный блок для runtime-пульта
 * (issue #54) и педагогической/студенческой проекций (issues #81, #82).
 */
import { useEffect, useRef, useState } from "react";
import { rpc, RpcError } from "./rpc.js";
import { useSwrCache, type SwrState } from "./cache.js";
import type { EventModel, EventState } from "../api/event.js";

export function useEvent(eventId: string | null): SwrState<EventModel> {
  return useSwrCache<EventModel>({
    key:     `event_${eventId ?? "none"}_v1`,
    fetcher: () => rpc<EventModel>("event.get", { event_id: eventId }),
    enabled: eventId !== null,
  });
}

const POLL_INTERVAL_MS = 60_000;

export interface EventStatePollState {
  state:   EventState | null;
  loading: boolean;
  error:   string | null;
  /** Принудительный опрос вне таймера — жест «обновить сейчас» (§17.4). */
  refresh: () => void;
}

export function useEventStatePoll(eventId: string | null): EventStatePollState {
  const [state, setState] = useState<EventState | null>(null);
  const [loading, setLoading] = useState(eventId !== null);
  const [error, setError] = useState<string | null>(null);
  // Счётчик, инкремент которого форсирует лишний прогон эффекта — так
  // «обновить сейчас» переиспользует тот же fetch-путь, что и таймер.
  const [tick, setTick] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!eventId) return;
    cancelledRef.current = false;

    function fetchOnce() {
      rpc<{ state: EventState }>("event.state", { event_id: eventId })
        .then((r) => {
          if (cancelledRef.current) return;
          setState(r.state);
          setLoading(false);
          setError(null);
        })
        .catch((e: unknown) => {
          if (cancelledRef.current) return;
          const msg = e instanceof RpcError ? `${e.message} (${e.code})` : String(e);
          setLoading(false);
          setError(msg);
        });
    }

    fetchOnce();
    const timer = window.setInterval(fetchOnce, POLL_INTERVAL_MS);
    return () => { cancelledRef.current = true; window.clearInterval(timer); };
  }, [eventId, tick]);

  return { state, loading, error, refresh: () => setTick((t) => t + 1) };
}
