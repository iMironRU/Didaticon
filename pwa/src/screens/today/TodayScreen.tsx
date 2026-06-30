/**
 * TodayScreen — дашборд «Сегодня» (Block II §9.1).
 *
 * Вызывает feed.get(context_id, limit=5), рендерит top-5 карточек
 * по urgency. SWR-кеш 60s через useSwrCache. Поддерживает:
 *  - Offline: показывает stale-данные с бейджем
 *  - Empty state: всё сделано
 *  - Loading skeleton: 3 карточки
 *  - Pull-to-refresh: кнопка ручного обновления
 */
import { useCallback, useState } from "react";
import { rpc } from "../../data/rpc.js";
import { useSwrCache, formatRelativeTime } from "../../data/cache.js";
import type { FeedResponse, FeedCard as FeedCardType } from "../../api/feed.js";
import { FeedCard, FeedCardSkeleton } from "./FeedCard.js";
import { useDocumentTitle } from "../../useDocumentTitle.js";
import { navigate } from "../../router.js";
import { USE_MOCK } from "../../auth/mock.js";

// Demo-мок для ?demo=student без реального RPC
const DEMO_FEED: FeedResponse = {
  cards: [
    {
      id: "demo-evt-1",
      kind: "event",
      source: "local",
      urgency: 82,
      due_at: new Date(Date.now() + 75 * 60_000).toISOString(),
      title: "Алгоритмы и структуры данных",
      subtitle: "Лекция · ауд. 301 · через 1 ч 15 мин",
      action: { kind: "open_event", target_id: "evt:demo-1" },
      details: {
        event_id: "evt:demo-1",
        event_kind: "lecture",
        discipline_id: "disc:asd",
        discipline_title: "Алгоритмы и структуры данных",
        teacher_name: "Петров В.А.",
        format: "offline",
        room: "301",
        meeting_url: null,
        package_ref: "pkg:asd-lec-5",
        has_pre_event_bonus: true,
        related_debts: { count: 0, kinds: [] },
      },
    },
    {
      id: "demo-fd-1",
      kind: "form_deadline",
      source: "local",
      urgency: 88,
      due_at: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      title: "Контрольная работа №2",
      subtitle: "Дедлайн: завтра · Дискретная математика",
      action: { kind: "open_form", target_id: "obl:demo-cw2" },
      details: {
        obligation_id: "obl:demo-cw2",
        form_kind: "control_work",
        discipline_id: "disc:dm",
        discipline_title: "Дискретная математика",
        open_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
        close_at: new Date(Date.now() + 86400_000).toISOString(),
      },
    },
    {
      id: "demo-aa-1",
      kind: "active_attempt",
      source: "local",
      urgency: 95,
      due_at: new Date(Date.now() + 12 * 60_000).toISOString(),
      title: "Идёт: Тест по теме 4",
      subtitle: "Осталось 12 минут · Дискретная математика",
      action: { kind: "open_attempt", target_id: "att:demo-t4" },
      details: {
        attempt_id: "att:demo-t4",
        form_control_id: "fc:dm-t4",
        form_kind: "test",
        discipline_id: "disc:dm",
        discipline_title: "Дискретная математика",
        started_at: new Date(Date.now() - 48 * 60_000).toISOString(),
        deadline_at: new Date(Date.now() + 12 * 60_000).toISOString(),
        remaining_minutes: 12,
      },
    },
    {
      id: "demo-ed-1",
      kind: "event_debt",
      source: "local",
      urgency: 65,
      due_at: new Date(Date.now() + 7 * 86400_000).toISOString(),
      title: "Пропуск: Операционные системы",
      subtitle: "Лекция · вчера · возможна отработка",
      action: { kind: "open_event_debt", target_id: "evt:demo-os" },
      details: {
        event_id: "evt:demo-os",
        event_date: new Date(Date.now() - 86400_000).toISOString().slice(0, 10),
        event_kind: "lecture",
        discipline_id: "disc:os",
        discipline_title: "Операционные системы",
        debt_kinds: ["attendance"],
        recovery_options: {
          online: { available: false },
          offline: { available: true, slots_count: 3 },
        },
      },
    },
    {
      id: "demo-ad-1",
      kind: "academic_debt",
      source: "local",
      urgency: 60,
      due_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
      title: "Задолженность: Математический анализ",
      subtitle: "Экзамен · Пересдача до конца сессии",
      action: { kind: "open_academic_debt", target_id: "disc:ma" },
      details: {
        discipline_id: "disc:ma",
        discipline_title: "Математический анализ",
        debt_kind: "retake",
        recovery_options: { online: { available: false }, offline: { available: true } },
      },
    },
  ],
  total_actionable: 5,
  has_more: false,
  generated_at: new Date().toISOString(),
  cache_ttl_seconds: 60,
};

interface Props {
  contextId: string;
}

export function TodayScreen({ contextId }: Props) {
  useDocumentTitle("Сегодня");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetcher = useCallback(
    () => rpc<FeedResponse>("feed.get", { context_id: contextId, limit: 5 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contextId, refreshKey],
  );

  const { data, loading, stale, fetchedAt, error } = useSwrCache<FeedResponse>({
    key:     `feed_cache_v1_${contextId}`,
    fetcher,
    enabled: !USE_MOCK,
  });

  // В demo-режиме используем статичный мок напрямую
  const feed: FeedResponse | null = USE_MOCK ? DEMO_FEED : data;
  const isLoading = !USE_MOCK && loading && !feed;

  function handleCardTap(card: FeedCardType) {
    // TODO Block III: маршрутизация по card.action.kind
    if (card.kind === "event" || card.kind === "active_attempt") {
      const id = (card.action?.target_id ?? "").replace("evt:", "").replace("att:", "");
      if (id) navigate({ name: "lesson", id });
    }
    // Остальные виды → заглушка, раскрываем в соответствующих этапах
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Заголовок + обновлено */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-fg">Актуальное</h2>
        <div className="flex items-center gap-2">
          {stale && (
            <span className="text-xs text-fg-muted" aria-live="polite">
              {formatRelativeTime(fetchedAt)}
            </span>
          )}
          {!USE_MOCK && (
            <button
              className="text-xs text-accent underline"
              onClick={() => setRefreshKey(k => k + 1)}
              aria-label="Обновить дашборд"
            >
              Обновить
            </button>
          )}
        </div>
      </div>

      {/* Stale banner */}
      {stale && !USE_MOCK && (
        <div
          className="text-xs text-fg-muted bg-surface border border-line rounded-lg px-3 py-2"
          role="status"
          aria-live="polite"
        >
          Данные из кеша. Обновление недоступно.
        </div>
      )}

      {/* Ошибка без кеша */}
      {error && !feed && (
        <div className="text-sm text-danger text-center py-8">{error}</div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Загрузка дашборда">
          <FeedCardSkeleton />
          <FeedCardSkeleton />
          <FeedCardSkeleton />
        </div>
      )}

      {/* Карточки */}
      {feed && feed.cards.length > 0 && (
        <div className="space-y-3" role="list" aria-label="Карточки дашборда">
          {feed.cards.map(card => (
            <div key={card.id} role="listitem">
              <FeedCard card={card} onTap={handleCardTap} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {feed && feed.cards.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl" aria-hidden="true">✓</span>
          <p className="text-fg font-semibold text-base">Всё сделано</p>
          <p className="text-fg-muted text-sm text-center">
            Нет срочных дел. Проверьте расписание.
          </p>
          <button
            className="mt-2 text-sm text-accent underline"
            onClick={() => navigate({ name: "schedule" })}
          >
            Расписание
          </button>
        </div>
      )}

      {/* Всего actionable */}
      {feed && feed.has_more && (
        <p className="text-xs text-fg-muted text-center pt-1">
          Показаны 5 из {feed.total_actionable} срочных дел
        </p>
      )}
    </div>
  );
}
