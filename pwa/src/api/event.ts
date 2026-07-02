/**
 * Типы event.get / event.state — Block III §4, §10, §15.1 (issue #80).
 * Registration-based модель состояний, зафиксирована v0.4.
 */

export type EventState =
  | "запланировано" | "регистрация" | "регистрация_закрыта"
  | "идёт" | "завершено" | "перенесено";

export interface EventModel {
  id:                        string;
  state:                     EventState;
  discipline_id:             string;
  discipline_title:          string;
  event_kind:                string;
  planned_start_at:          string;
  planned_end_at:            string;
  registration_opened_at:    string | null;
  actually_started_at:       string | null;
  actually_ended_at:         string | null;
  postponed_at:              string | null;
  postponement_reason_code:  string | null;
  replacement_event_id:      string | null;
  format:                    "offline" | "online" | "hybrid";
  room:                      string | null;
  meeting_url:               string | null;
  groups:                    Array<{ group_id: string; title: string; count: number }>;
  package_ref:               string | null;
  teacher:                   { context_id: string; name: string };
}

export interface AttendanceModel {
  student_context_id: string;
  registered_at:       string | null;
  status:              "pending" | "confirmed" | "rejected";
  validated_by:        string | null;
  validated_at:        string | null;
}

// ── Gate-логика §10 ────────────────────────────────────────────────────────────

export type VisibilityGate = "enrolled" | "pre_event" | "during_event" | "teacher_unlocked";

export type FormsControlAccess =
  | "none"                                // формы недоступны
  | "active_only"                         // только запущенные (идёт)
  | "completed_and_post_event_bonuses";   // завершённые + post_event-бонусы (завершено)

export interface GateAccess {
  /** Уровни видимости материалов, гарантированные состоянием+регистрацией.
   *  `teacher_unlocked` сюда НЕ включается — это отдельный persist-флаг
   *  пакета, переключаемый педагогом вручную (§9.1), объединяется на
   *  стороне вызывающего кода. */
  materials:    VisibilityGate[];
  formsControl: FormsControlAccess;
  /** true → карточка read-only (завершено/перенесено). */
  readOnly:     boolean;
}

/**
 * Матрица состояние × факт регистрации → доступ (§10 таблица).
 * `confirmed` — статус AttendanceModel.status. `pending`/`rejected`/`null`
 * (нет записи) трактуются как «не отмечен».
 */
export function getGateAccess(
  state:            EventState,
  attendanceStatus: AttendanceModel["status"] | null,
): GateAccess {
  const confirmed = attendanceStatus === "confirmed";
  const BASE: VisibilityGate[] = ["enrolled", "pre_event"];
  const DURING: VisibilityGate[] = ["enrolled", "pre_event", "during_event"];

  switch (state) {
    case "запланировано":
      return { materials: BASE, formsControl: "none", readOnly: false };

    case "регистрация":
    case "регистрация_закрыта":
      return confirmed
        ? { materials: DURING, formsControl: "none", readOnly: false }
        : { materials: BASE, formsControl: "none", readOnly: false };

    case "идёт":
      return confirmed
        ? { materials: DURING, formsControl: "active_only", readOnly: false }
        : { materials: BASE, formsControl: "none", readOnly: false };

    case "завершено":
      return confirmed
        ? { materials: DURING, formsControl: "completed_and_post_event_bonuses", readOnly: true }
        : { materials: BASE, formsControl: "none", readOnly: true };

    case "перенесено":
      return { materials: ["enrolled"], formsControl: "none", readOnly: true };
  }
}

/** Учитывает материал видимым, если его уровень входит в gate ИЛИ пакет
 *  явно разблокирован педагогом (`teacherUnlocked`, §9.1). ФОС (enrolled) —
 *  всегда видим независимо от gate (§9.2 нормативное ограничение). */
export function isMaterialVisible(
  materialGate:     VisibilityGate,
  access:           GateAccess,
  teacherUnlocked:  boolean,
): boolean {
  if (materialGate === "teacher_unlocked") return teacherUnlocked;
  return access.materials.includes(materialGate);
}
