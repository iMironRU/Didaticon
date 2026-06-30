/**
 * feed.get (Block II §9) — mock-сборщик дашборда.
 *
 * Принимает context_id, возвращает top-5 карточек по urgency.
 * Когда подключим реальный Univerkon — заменяем на batch-запросы.
 */
import type { JWTPayload } from "jose";

interface FeedParams {
  context_id?: string;
  limit?: number;
}

// Возвращаем mock-данные по context_id.
// Реальные данные придут из Univerkon/Тестикон после интеграции.
export async function feedGet(params: Record<string, unknown>, _claims: JWTPayload) {
  const { context_id, limit = 5 } = params as FeedParams;
  const cards = getMockCards(context_id ?? "");
  const sorted = [...cards].sort((a, b) => b.urgency - a.urgency);
  const top = sorted.slice(0, limit);
  return {
    cards: top,
    total_actionable: cards.length,
    has_more: cards.length > limit,
    generated_at: new Date().toISOString(),
    cache_ttl_seconds: 60,
  };
}

// Сегодняшняя дата + N минут/часов/дней
function offsetISO(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function getMockCards(contextId: string) {
  // Студент
  if (contextId.startsWith("stu:")) {
    const today = new Date().toISOString().slice(0, 10);
    return [
      {
        id: "card-evt-1",
        kind: "event",
        source: "local",
        urgency: 82,
        due_at: offsetISO(75),
        title: "Алгоритмы и структуры данных",
        subtitle: "Лекция · ауд. 301 · через 1 ч 15 мин",
        action: { kind: "open_event", target_id: "evt:mock-1" },
        details: {
          event_id: "evt:mock-1",
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
        id: "card-fd-1",
        kind: "form_deadline",
        source: "local",
        urgency: 88,
        due_at: offsetISO(24 * 60),
        title: "Контрольная работа №2",
        subtitle: "Дедлайн: завтра · Дискретная математика",
        action: { kind: "open_form", target_id: "obl:mock-cw2" },
        details: {
          obligation_id: "obl:mock-cw2",
          form_kind: "control_work",
          discipline_id: "disc:dm",
          discipline_title: "Дискретная математика",
          open_at: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
          close_at: offsetISO(24 * 60),
        },
      },
      {
        id: "card-ed-1",
        kind: "event_debt",
        source: "local",
        urgency: 65,
        due_at: offsetISO(7 * 24 * 60),
        title: "Пропуск: Операционные системы",
        subtitle: `Лекция · ${today} · возможна отработка`,
        action: { kind: "open_event_debt", target_id: "evt:mock-os-lec" },
        details: {
          event_id: "evt:mock-os-lec",
          event_date: today,
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
        id: "card-aa-1",
        kind: "active_attempt",
        source: "local",
        urgency: 95,
        due_at: offsetISO(12),
        title: "Идёт: Тест по теме 4",
        subtitle: "Осталось 12 минут · Дискретная математика",
        action: { kind: "open_attempt", target_id: "att:mock-t4" },
        details: {
          attempt_id: "att:mock-t4",
          form_control_id: "fc:dm-t4",
          form_kind: "test",
          discipline_id: "disc:dm",
          discipline_title: "Дискретная математика",
          started_at: offsetISO(-48),
          deadline_at: offsetISO(12),
          remaining_minutes: 12,
        },
      },
      {
        id: "card-ad-1",
        kind: "academic_debt",
        source: "local",
        urgency: 60,
        due_at: offsetISO(30 * 24 * 60),
        title: "Задолженность: Математический анализ",
        subtitle: "Экзамен · Пересдача до конца сессии",
        action: { kind: "open_academic_debt", target_id: "disc:ma" },
        details: {
          discipline_id: "disc:ma",
          discipline_title: "Математический анализ",
          debt_kind: "retake",
          recovery_options: {
            online: { available: false },
            offline: { available: true },
          },
        },
      },
      {
        id: "card-dr-1",
        kind: "delivery_required",
        source: "local",
        urgency: 45,
        due_at: offsetISO(3 * 24 * 60),
        title: "Сдать курсовую работу",
        subtitle: "Кафедра ИВТ, каб. 205 · срок через 3 дня",
        action: { kind: "open_delivery", target_id: "obl:mock-kursach" },
        details: {
          obligation_id: "obl:mock-kursach",
          work_title: "Курсовая работа по ОС",
          discipline_id: "disc:os",
          discipline_title: "Операционные системы",
          delivery_point: "Кафедра ИВТ, каб. 205",
        },
      },
    ];
  }

  // Преподаватель-инструктор
  if (contextId.startsWith("tch:") && !contextId.includes("curator") && !contextId.includes("sg")) {
    return [
      {
        id: "card-tev-1",
        kind: "event",
        source: "local",
        urgency: 80,
        due_at: offsetISO(90),
        title: "Алгоритмы и структуры данных",
        subtitle: "Лекция · ИВТ-21, ИВТ-22 · ауд. 301",
        action: { kind: "open_event_teacher", target_id: "evt:tch-mock-1" },
        details: {
          event_id: "evt:tch-mock-1",
          event_kind: "lecture",
          discipline_id: "disc:asd",
          discipline_title: "Алгоритмы и структуры данных",
          groups: ["ИВТ-21", "ИВТ-22"],
          format: "offline",
          room: "301",
          meeting_url: null,
          package_ref: "pkg:asd-lec-5",
          registration_count: 34,
          registration_expected: 36,
          current_state: "запланировано",
          pre_event_bonuses_picked: 7,
        },
      },
      {
        id: "card-stg-1",
        kind: "submissions_to_grade",
        source: "local",
        urgency: 74,
        due_at: offsetISO(2 * 24 * 60),
        title: "24 работы на проверке",
        subtitle: "Ближайший дедлайн: через 2 дня",
        action: { kind: "open_submissions_to_grade", scope: "own" },
        details: {
          queue_size: 24,
          by_discipline: [
            { discipline_id: "disc:asd", discipline_title: "Алгоритмы и структуры данных", count: 18 },
            { discipline_id: "disc:os", discipline_title: "Операционные системы", count: 6 },
          ],
          oldest_pending_at: offsetISO(-5 * 24 * 60),
          nearest_deadline_at: offsetISO(2 * 24 * 60),
          scope_hint: "own",
        },
      },
    ];
  }

  // Пустой фид для неизвестных/куратор
  return [];
}
