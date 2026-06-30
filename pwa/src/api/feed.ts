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

// ── Union ─────────────────────────────────────────────────────────────────────

export type FeedCard =
  | EventCard
  | FormDeadlineCard
  | EventDebtCard
  | AcademicDebtCard
  | DeliveryRequiredCard
  | ActiveAttemptCard
  | ExternalActionCard
  | (CardBase & { kind: FeedCardKind; details: Record<string, unknown> });

export interface FeedResponse {
  cards:            FeedCard[];
  total_actionable: number;
  has_more:         boolean;
  generated_at:     string;
  cache_ttl_seconds: number;
}
