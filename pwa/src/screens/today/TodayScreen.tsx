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
import type { FeedResponse, FeedCard as FeedCardType, FeedGroup } from "../../api/feed.js";
import { groupFeedCards } from "../../api/feed.js";
import { FeedCard, FeedCardSkeleton } from "./FeedCard.js";
import { useDocumentTitle } from "../../useDocumentTitle.js";
import { navigate } from "../../router.js";
import { USE_MOCK } from "../../auth/mock.js";
import { usePullToRefresh } from "../../usePullToRefresh.js";
import { Spinner } from "../../ui/Spinner.js";
import { Button } from "../../ui/Button.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/Tabs.js";
import { login } from "../../auth/oidc.js";

const GROUP_ORDER: FeedGroup[] = ["upcoming", "overdue", "attention"];
const GROUP_LABEL: Record<FeedGroup, string> = {
  upcoming:  "Ближайшее",
  overdue:   "Просрочено",
  attention: "Требует внимания",
};
// Пустое состояние колонки/таба, когда в конкретной группе нет карточек
// (обсуждено 2026-07-02: мобиле — табы, десктоп — три колонки).
const GROUP_EMPTY: Record<FeedGroup, string> = {
  upcoming:  "Нет ближайших дел",
  overdue:   "Просрочек нет",
  attention: "Ничего не требует внимания",
};

// Demo-фиды для разных ролей (определяются по prefixe contextId)
function getDemoFeed(contextId: string): FeedResponse {
  if (contextId.includes("curator")) return DEMO_FEED_CURATOR;
  if (contextId.includes("sg"))      return DEMO_FEED_SG;
  if (contextId.startsWith("tch:")) return DEMO_FEED_INSTRUCTOR;
  if (contextId.startsWith("par:")) return DEMO_FEED_PARENT;
  return DEMO_FEED_STUDENT;
}

// ── Demo: студент ─────────────────────────────────────────────────────────────
const DEMO_FEED_STUDENT: FeedResponse = {
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

// ── Demo: instructor ──────────────────────────────────────────────────────────
const DEMO_FEED_INSTRUCTOR: FeedResponse = {
  cards: [
    {
      id: "di-stg-1",
      kind: "submissions_to_grade",
      source: "local",
      urgency: 88,
      due_at: new Date(Date.now() + 2 * 86400_000).toISOString(),
      title: "24 работы ждут проверки",
      subtitle: "Ближайший дедлайн: через 2 дня",
      action: { kind: "open_submissions_to_grade", scope: "own" },
      details: {
        queue_size: 24,
        by_discipline: [
          { discipline_id: "disc:asd", discipline_title: "Алгоритмы и структуры данных", count: 18 },
          { discipline_id: "disc:os",  discipline_title: "Операционные системы", count: 6 },
        ],
        oldest_pending_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
        nearest_deadline_at: new Date(Date.now() + 2 * 86400_000).toISOString(),
        scope_hint: "own",
      },
    },
    {
      id: "di-evt-1",
      kind: "event",
      source: "local",
      urgency: 80,
      due_at: new Date(Date.now() + 90 * 60_000).toISOString(),
      title: "Алгоритмы и структуры данных",
      subtitle: "Лекция · ИС-21-1, ИС-21-2 · ауд. 301 · через 1 ч 30 мин",
      action: { kind: "open_event_teacher", target_id: "evt:tch-demo-1" },
      details: {
        event_id: "evt:tch-demo-1",
        event_kind: "lecture",
        discipline_id: "disc:asd",
        discipline_title: "Алгоритмы и структуры данных",
        teacher_name: null,
        format: "offline",
        room: "301",
        meeting_url: null,
        package_ref: null,
        has_pre_event_bonus: false,
        related_debts: { count: 0, kinds: [] },
      },
    },
    {
      id: "di-ted-1",
      kind: "teacher_event_debt",
      source: "local",
      urgency: 72,
      due_at: new Date(Date.now() + 86400_000).toISOString(),
      title: "Не отмечена посещаемость",
      subtitle: "Семинар · вчера · ИС-21-1",
      action: { kind: "open_attendance", target_id: "evt:tch-demo-sem" },
      details: {
        event_id: "evt:tch-demo-sem",
        event_date: new Date(Date.now() - 86400_000).toISOString().slice(0, 10),
        event_kind: "seminar",
        discipline_title: "Алгоритмы и структуры данных",
        group_name: "ИС-21-1",
        debt_kind: "attendance_not_marked",
      },
    },
    {
      id: "di-mcr-1",
      kind: "module_close_required",
      source: "local",
      urgency: 65,
      due_at: new Date(Date.now() + 3 * 86400_000).toISOString(),
      title: "Завершить модуль 3",
      subtitle: "Операционные системы · ИС-21-2 · 2 незакрытых занятия",
      action: { kind: "open_module", target_id: "mod:os-3" },
      details: {
        module_id: "mod:os-3",
        discipline_title: "Операционные системы",
        group_name: "ИС-21-2",
        due_at: new Date(Date.now() + 3 * 86400_000).toISOString(),
        unclosed_slots: 2,
      },
    },
  ],
  total_actionable: 4,
  has_more: false,
  generated_at: new Date().toISOString(),
  cache_ttl_seconds: 60,
};

// ── Demo: curator ─────────────────────────────────────────────────────────────
const DEMO_FEED_CURATOR: FeedResponse = {
  cards: [
    {
      id: "dc-sar-1",
      kind: "student_at_risk",
      source: "targeted",
      urgency: 92,
      due_at: null,
      title: "Петров А.С. — риск отчисления",
      subtitle: "ИС-21-1 · 3 задолженности · посещаемость 41%",
      action: { kind: "open_student", target_id: "s-fail-1" },
      details: {
        student_id: "s-fail-1",
        student_name: "Петров Алексей Сергеевич",
        group_name: "ИС-21-1",
        risk_reason: "3 академические задолженности + низкая посещаемость",
        debts_count: 3,
        attendance_rate: 0.41,
      },
    },
    {
      id: "dc-gas-1",
      kind: "group_attendance_summary",
      source: "local",
      urgency: 70,
      due_at: null,
      title: "Посещаемость группы ИС-21-1 ниже нормы",
      subtitle: "Неделя · 58% (порог 75%)",
      action: { kind: "open_group_attendance", target_id: "grp:is21-1" },
      details: {
        group_name: "ИС-21-1",
        period: "2026-06-24–2026-06-30",
        attendance_rate: 0.58,
        threshold: 0.75,
        at_risk_count: 4,
        total_students: 25,
      },
    },
    {
      id: "dc-gds-1",
      kind: "group_debts_summary",
      source: "local",
      urgency: 65,
      due_at: new Date(Date.now() + 7 * 86400_000).toISOString(),
      title: "Долги по Математическому анализу",
      subtitle: "ИС-21-1 · 7 студентов · 2 критических",
      action: { kind: "open_group_debts", target_id: "grp:is21-1" },
      details: {
        group_name: "ИС-21-1",
        discipline_title: "Математический анализ",
        debts_count: 7,
        critical_count: 2,
        total_students: 25,
      },
    },
  ],
  total_actionable: 3,
  has_more: false,
  generated_at: new Date().toISOString(),
  cache_ttl_seconds: 60,
};

// ── Demo: senior_grader ───────────────────────────────────────────────────────
const DEMO_FEED_SG: FeedResponse = {
  cards: [
    {
      id: "sg-stg-1",
      kind: "submissions_to_grade",
      source: "local",
      urgency: 90,
      due_at: new Date(Date.now() + 86400_000).toISOString(),
      title: "47 работ на проверке",
      subtitle: "Ближайший дедлайн: завтра · по кафедре",
      action: { kind: "open_submissions_to_grade", scope: "department" },
      details: {
        queue_size: 47,
        by_discipline: [
          { discipline_id: "disc:asd", discipline_title: "Алгоритмы и структуры данных", count: 30 },
          { discipline_id: "disc:os",  discipline_title: "Операционные системы", count: 17 },
        ],
        oldest_pending_at: new Date(Date.now() - 10 * 86400_000).toISOString(),
        nearest_deadline_at: new Date(Date.now() + 86400_000).toISOString(),
        scope_hint: "department",
      },
    },
    {
      id: "sg-app-1",
      kind: "appeals",
      source: "local",
      urgency: 78,
      due_at: new Date(Date.now() + 2 * 86400_000).toISOString(),
      title: "3 апелляции ожидают рассмотрения",
      subtitle: "Дискретная математика · срок через 2 дня",
      action: { kind: "open_appeals", target_id: "disc:dm" },
      details: {
        count: 3,
        discipline_id: "disc:dm",
        discipline_title: "Дискретная математика",
        deadline_at: new Date(Date.now() + 2 * 86400_000).toISOString(),
      },
    },
    {
      id: "sg-gop-1",
      kind: "grade_override_pending",
      source: "local",
      urgency: 60,
      due_at: new Date(Date.now() + 5 * 86400_000).toISOString(),
      title: "Пересмотр оценки ожидает решения",
      subtitle: "Запрос от Петров В.А. · 2 записи",
      action: { kind: "open_grade_overrides" },
      details: {
        count: 2,
        discipline_title: "Алгоритмы и структуры данных",
        requested_by: "Петров В.А.",
        requested_at: new Date(Date.now() - 86400_000).toISOString(),
      },
    },
  ],
  total_actionable: 3,
  has_more: false,
  generated_at: new Date().toISOString(),
  cache_ttl_seconds: 60,
};

// ── Demo: parent ──────────────────────────────────────────────────────────────
const DEMO_FEED_PARENT: FeedResponse = {
  cards: [
    {
      id: "dp-caa-1",
      kind: "child_attendance_alert",
      source: "targeted",
      urgency: 85,
      due_at: null,
      title: "Мария пропустила занятие",
      subtitle: "Сегодня · Операционные системы · лекция",
      action: { kind: "open_child_attendance", target_id: "s-test-1" },
      details: {
        child_student_id: "s-test-1",
        child_name: "Иванова Мария",
        missed_today: 1,
        event_kind: "lecture",
        discipline_title: "Операционные системы",
        event_date: new Date().toISOString().slice(0, 10),
      },
    },
    {
      id: "dp-cda-1",
      kind: "child_debts_alert",
      source: "local",
      urgency: 72,
      due_at: new Date(Date.now() + 15 * 86400_000).toISOString(),
      title: "Задолженность: Дискретная математика",
      subtitle: "Мария · пересдача до 15 июля",
      action: { kind: "open_child_debt", target_id: "s-test-1" },
      details: {
        child_student_id: "s-test-1",
        child_name: "Иванова Мария",
        discipline_title: "Дискретная математика",
        debt_kind: "retake",
        retake_at: new Date(Date.now() + 15 * 86400_000).toISOString(),
      },
    },
  ],
  total_actionable: 2,
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
  const [activeGroup, setActiveGroup] = useState<FeedGroup>("upcoming");

  const fetcher = useCallback(
    () => rpc<FeedResponse>("feed.get", { context_id: contextId, limit: 5 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contextId, refreshKey],
  );

  const { data, loading, stale, fetchedAt, error, isAuthError } = useSwrCache<FeedResponse>({
    key:     `feed_cache_v1_${contextId}`,
    fetcher,
    enabled: !USE_MOCK,
  });

  // В demo-режиме используем статичный мок напрямую (по роли из contextId)
  const feed: FeedResponse | null = USE_MOCK ? getDemoFeed(contextId) : data;
  const isLoading = !USE_MOCK && loading && !feed;

  const { pullDistance, refreshing, ready } = usePullToRefresh(
    () => setRefreshKey(k => k + 1),
    !USE_MOCK,
  );

  const [reauthing, setReauthing] = useState(false);
  async function handleReauth() {
    setReauthing(true);
    try {
      await login(); // popup-флоу (#58) — не трогаем App-level auth state,
      // токен в localStorage обновится сам, следующий fetcher() его подхватит
      setRefreshKey(k => k + 1);
    } finally {
      setReauthing(false);
    }
  }

  function handleCardTap(card: FeedCardType) {
    // TODO Block III: маршрутизация по card.action.kind
    if (card.kind === "event" || card.kind === "active_attempt") {
      const id = (card.action?.target_id ?? "").replace("evt:", "").replace("att:", "");
      if (id) navigate({ name: "lesson", id });
    }
    // Остальные виды → заглушка, раскрываем в соответствующих этапах
  }

  return (
    <div className="px-4 py-4 space-y-3 md:pt-0 md:pb-8">
      {/* Читаемая ширина И верхний отступ на десктопе задаются один раз в
          UnifiedShell (на <main>, md:max-w-2xl + md:pt-8) — одинаково для
          всех вкладок. md:pt-0 здесь гасит СВОЙ верхний паддинг (иначе
          сложился бы с main'овским), md:pb-8 — свой нижний, независимый
          от других вкладок (issue #62/#77). */}
      {/* Pull-to-refresh индикатор — растёт вместе с оттягиванием пальца,
          жест дублирует кнопку "Обновить" ниже, не заменяет её. */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center gap-2 text-xs text-fg-muted overflow-hidden transition-[height]"
          style={{ height: refreshing ? 40 : pullDistance }}
          role="status"
          aria-live="polite"
        >
          {refreshing
            ? <><Spinner size={16} /> Обновление…</>
            : ready
              ? "Отпустите для обновления"
              : "Потяните для обновления"
          }
        </div>
      )}

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
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="text-sm text-danger text-center">{error}</div>
          {isAuthError && (
            <Button variant="primary" size="sm" onClick={handleReauth} disabled={reauthing}>
              {reauthing ? <><Spinner size={14} /> Входим…</> : "Войти снова"}
            </Button>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Загрузка дашборда">
          <FeedCardSkeleton />
          <FeedCardSkeleton />
          <FeedCardSkeleton />
        </div>
      )}

      {/* Карточки — сгруппированы по kind (обсуждено 2026-07-01), не единой
          лентой вперемешку. Порядок групп: сначала то, что ещё можно успеть,
          потом просроченное, потом мониторинг-алерты без чёткого дедлайна.
          Мобиле — табы (обсуждено 2026-07-02, экономит вертикаль на узком
          экране), десктоп — три колонки side-by-side (места достаточно,
          сравнение групп одним взглядом важнее). Обе разметки в DOM
          одновременно, переключаются md:-брейкпоинтом — тот же паттерн,
          что у LeftRail/BottomNav. */}
      {feed && feed.cards.length > 0 && (() => {
        const grouped = groupFeedCards(feed.cards);
        return (
          <>
            <div className="md:hidden">
              <Tabs value={activeGroup} onValueChange={(v) => setActiveGroup(v as FeedGroup)}>
                <TabsList aria-label="Группа карточек">
                  {GROUP_ORDER.map(group => (
                    <TabsTrigger key={group} value={group}>
                      {GROUP_LABEL[group]}
                      {grouped[group].length > 0 ? ` (${grouped[group].length})` : ""}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {GROUP_ORDER.map(group => (
                  <TabsContent key={group} value={group}>
                    {grouped[group].length > 0 ? (
                      <div className="space-y-3" role="list" aria-label={GROUP_LABEL[group]}>
                        {grouped[group].map(card => (
                          <div key={card.id} role="listitem">
                            <FeedCard card={card} onTap={handleCardTap} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-fg-muted text-sm text-center py-6">{GROUP_EMPTY[group]}</p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:items-start">
              {GROUP_ORDER.map(group => (
                <div key={group} className="space-y-2">
                  <div className="text-fg-muted text-[0.68rem] tracking-[0.08em] uppercase font-semibold">
                    {GROUP_LABEL[group]}
                    {grouped[group].length > 0 ? ` (${grouped[group].length})` : ""}
                  </div>
                  {grouped[group].length > 0 ? (
                    <div className="space-y-3" role="list" aria-label={GROUP_LABEL[group]}>
                      {grouped[group].map(card => (
                        <div key={card.id} role="listitem">
                          <FeedCard card={card} onTap={handleCardTap} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-fg-muted text-xs">{GROUP_EMPTY[group]}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        );
      })()}

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
