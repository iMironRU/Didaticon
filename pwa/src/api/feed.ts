/**
 * Типы feed.get — Block II §5.
 * Общая шапка + дискриминированный union по kind.
 */

export type FeedCardKind =
  | "event" | "form_deadline" | "event_debt" | "academic_debt"
  | "delivery_required" | "active_attempt"
  | "teacher_event_debt" | "submissions_to_grade"
  | "module_close_required" | "appeals" | "grade_override_pending"
  | "group_attendance_summary" | "group_debts_summary" | "student_at_risk"
  | "child_attendance_alert" | "child_debts_alert" | "child_at_risk"
  | "external_action";

export interface FeedAction {
  kind: string;
  target_id?: string;
  tab?: string;
  filter?: string;
  scope?: "own" | "department";
  deep_link?: string;
  fallback_url?: string;
  focus_tab?: string;
}

// ── Базовая шапка ─────────────────────────────────────────────────────────────

interface CardBase {
  id:       string;
  source:   "local" | "targeted" | "critical";
  urgency:  number;
  due_at:   string | null;
  title:    string;
  subtitle: string;
  action:   FeedAction | null;
}

// ── Student cards ─────────────────────────────────────────────────────────────

export interface EventCard extends CardBase {
  kind: "event";
  details: {
    event_id:             string;
    event_kind:           string;
    discipline_id:        string;
    discipline_title:     string;
    teacher_name:         string;
    format:               "offline" | "online" | "hybrid";
    room:                 string | null;
    meeting_url:          string | null;
    package_ref:          string | null;
    has_pre_event_bonus:  boolean;
    related_debts:        { count: number; kinds: string[] };
  };
}

export interface FormDeadlineCard extends CardBase {
  kind: "form_deadline";
  details: {
    obligation_id:    string;
    form_kind:        string;
    discipline_id:    string;
    discipline_title: string;
    open_at:          string;
    close_at:         string;
  };
}

export interface EventDebtCard extends CardBase {
  kind: "event_debt";
  details: {
    event_id:         string;
    event_date:       string;
    event_kind:       string;
    discipline_id:    string;
    discipline_title: string;
    debt_kinds:       string[];
    recovery_options: {
      online:  { available: boolean };
      offline: { available: boolean; slots_count?: number };
    };
  };
}

export interface AcademicDebtCard extends CardBase {
  kind: "academic_debt";
  details: {
    discipline_id:    string;
    discipline_title: string;
    debt_kind:        "retake" | "commission" | "open";
    recovery_options: {
      online:  { available: boolean };
      offline: { available: boolean };
    };
  };
}

export interface DeliveryRequiredCard extends CardBase {
  kind: "delivery_required";
  details: {
    obligation_id:    string;
    work_title:       string;
    discipline_id:    string;
    discipline_title: string;
    delivery_point:   string | null;
  };
}

export interface ActiveAttemptCard extends CardBase {
  kind: "active_attempt";
  details: {
    attempt_id:       string;
    form_control_id:  string;
    form_kind:        string;
    discipline_id:    string;
    discipline_title: string;
    started_at:       string;
    deadline_at:      string;
    remaining_minutes: number;
  };
}

export interface ExternalActionCard extends CardBase {
  kind: "external_action";
  details: {
    notification_id: string;
    source_system:   string;
    external_id:     string;
    deep_link:       string;
    fallback_url:    string;
  };
}

// ── Teacher cards ─────────────────────────────────────────────────────────────

export interface SubmissionsToGradeCard extends CardBase {
  kind: "submissions_to_grade";
  details: {
    queue_size:          number;
    by_discipline:       Array<{ discipline_id: string; discipline_title: string; count: number }>;
    oldest_pending_at:   string;
    nearest_deadline_at: string;
    scope_hint:          "own" | "department";
  };
}

export interface TeacherEventDebtCard extends CardBase {
  kind: "teacher_event_debt";
  details: {
    event_id:         string;
    event_date:       string;
    event_kind:       string;
    discipline_title: string;
    group_name:       string;
    debt_kind:        "attendance_not_marked" | "material_not_uploaded";
  };
}

export interface ModuleCloseRequiredCard extends CardBase {
  kind: "module_close_required";
  details: {
    module_id:        string;
    discipline_title: string;
    group_name:       string;
    due_at:           string;
    unclosed_slots:   number;
  };
}

export interface AppealsCard extends CardBase {
  kind: "appeals";
  details: {
    count:         number;
    discipline_id: string;
    discipline_title: string;
    deadline_at:   string;
  };
}

export interface GradeOverridePendingCard extends CardBase {
  kind: "grade_override_pending";
  details: {
    count:            number;
    discipline_title: string;
    requested_by:     string;
    requested_at:     string;
  };
}

// ── Curator / senior_grader cards ─────────────────────────────────────────────

export interface GroupAttendanceSummaryCard extends CardBase {
  kind: "group_attendance_summary";
  details: {
    group_name:        string;
    period:            string;
    attendance_rate:   number;  // 0..1
    threshold:         number;  // 0..1 — порог тревоги
    at_risk_count:     number;
    total_students:    number;
  };
}

export interface GroupDebtsSummaryCard extends CardBase {
  kind: "group_debts_summary";
  details: {
    group_name:        string;
    discipline_title:  string;
    debts_count:       number;
    critical_count:    number;  // риск отчисления
    total_students:    number;
  };
}

export interface StudentAtRiskCard extends CardBase {
  kind: "student_at_risk";
  details: {
    student_id:    string;
    student_name:  string;
    group_name:    string;
    risk_reason:   string;
    debts_count:   number;
    attendance_rate: number;
  };
}

// ── Parent cards ──────────────────────────────────────────────────────────────

export interface ChildAttendanceAlertCard extends CardBase {
  kind: "child_attendance_alert";
  details: {
    child_student_id: string;
    child_name:       string;
    missed_today:     number;
    event_kind:       string;
    discipline_title: string;
    event_date:       string;
  };
}

export interface ChildDebtsAlertCard extends CardBase {
  kind: "child_debts_alert";
  details: {
    child_student_id: string;
    child_name:       string;
    discipline_title: string;
    debt_kind:        string;
    retake_at:        string | null;
  };
}

export interface ChildAtRiskCard extends CardBase {
  kind: "child_at_risk";
  details: {
    child_student_id: string;
    child_name:       string;
    risk_reason:      string;
    debts_count:      number;
    attendance_rate:  number;
  };
}

// ── Union ─────────────────────────────────────────────────────────────────────

export type FeedCard =
  | EventCard
  | FormDeadlineCard
  | EventDebtCard
  | AcademicDebtCard
  | DeliveryRequiredCard
  | ActiveAttemptCard
  | ExternalActionCard
  | SubmissionsToGradeCard
  | TeacherEventDebtCard
  | ModuleCloseRequiredCard
  | AppealsCard
  | GradeOverridePendingCard
  | GroupAttendanceSummaryCard
  | GroupDebtsSummaryCard
  | StudentAtRiskCard
  | ChildAttendanceAlertCard
  | ChildDebtsAlertCard
  | ChildAtRiskCard
  | (CardBase & { kind: FeedCardKind; details: Record<string, unknown> });

export interface FeedResponse {
  cards:            FeedCard[];
  total_actionable: number;
  has_more:         boolean;
  generated_at:     string;
  cache_ttl_seconds: number;
}

// ── Группировка ленты по kind ────────────────────────────────────────────────
// Обсуждено 2026-07-01: студент/родитель должны видеть отдельно «то, что ещё
// можно успеть» от «то, что уже просрочено» — раньше всё было одной лентой,
// отсортированной по urgency вперемешку. Применяется на mobile И desktop
// одинаково (issue про правую панель десктопа заменён этим).

export type FeedGroup = "upcoming" | "overdue" | "attention";

/** Источник истины — какой kind в какую группу попадает. Добавляя новый kind
 *  в FeedCardKind, обязательно дополни эту карту (иначе TS не даст собрать). */
export const FEED_GROUP_BY_KIND: Record<FeedCardKind, FeedGroup> = {
  // "Ближайшее" — ещё есть время среагировать
  event:                    "upcoming",
  form_deadline:            "upcoming",
  delivery_required:        "upcoming",
  active_attempt:           "upcoming",
  submissions_to_grade:     "upcoming",
  module_close_required:    "upcoming",
  appeals:                  "upcoming",
  // "Просрочено" — дедлайн уже прошёл / долг уже есть
  event_debt:               "overdue",
  academic_debt:            "overdue",
  teacher_event_debt:       "overdue",
  group_debts_summary:      "overdue",
  child_attendance_alert:   "overdue",
  child_debts_alert:        "overdue",
  // "Требует внимания" — мониторинг/алерт без чёткого дедлайна
  external_action:          "attention",
  grade_override_pending:   "attention",
  group_attendance_summary: "attention",
  student_at_risk:          "attention",
  child_at_risk:            "attention",
};

/** Раскладывает карточки по группам, сохраняя внутригрупповой порядок
 *  (сервер уже отсортировал по urgency). */
export function groupFeedCards(cards: FeedCard[]): Record<FeedGroup, FeedCard[]> {
  const result: Record<FeedGroup, FeedCard[]> = { upcoming: [], overdue: [], attention: [] };
  for (const card of cards) {
    result[FEED_GROUP_BY_KIND[card.kind]].push(card);
  }
  return result;
}
