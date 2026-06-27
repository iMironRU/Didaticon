// Контракт зачётки: GET /eios/student/{learnerId}/gradebook
// Текущее состояние всех итоговых контролей — не только закрытые.
import type { LearnerId, UnitId } from "./ids.js";
import type { FinalControlType } from "./trajectory.js";
import type { BookingSlot, Teacher } from "./schedule.js";

// ---------------------------------------------------------------------------
// Ответ API зачётки
// ---------------------------------------------------------------------------

export interface GradebookResponse {
  learnerId: LearnerId;
  semesters: GradebookSemester[];
}

export interface GradebookSemester {
  period:    string;  // "2025-2026-spring"
  label:     string;  // "I курс · Весенний семестр 2026"
  isCurrent: boolean;
  entries:   GradebookEntry[];
}

export interface GradebookEntry {
  unitId:      UnitId;
  code:        string;
  title:       string;
  credits:     number;
  finalControl: GradebookFinalControl;
  // Группировка для СПО (ПМ):
  groupCode?:  string; // "ПМ.01"
  groupTitle?: string;
}

// ---------------------------------------------------------------------------
// Состояние итогового контроля
// ---------------------------------------------------------------------------

export type GradebookFinalControl =
  | GradebookInProgress
  | GradebookPassed
  | GradebookRetakeScheduled
  | GradebookRetakePending
  | GradebookFailed;

interface GradebookBase {
  type: FinalControlType;
}

export interface GradebookInProgress extends GradebookBase {
  state:        "in_progress";
  plannedDate?: string;         // ISO date
}

export interface GradebookPassed extends GradebookBase {
  state:     "passed";
  date:      string;            // ISO date
  grade:     2 | 3 | 4 | 5;
  grade100?: number;
  teacher?:  string;
}

export interface GradebookRetakeScheduled extends GradebookBase {
  state:          "failed_retake_scheduled";
  attemptNumber:  1 | 2 | 3;
  isCommission:   boolean;
  retakeDate:     string;       // ISO date
  availableSlots: BookingSlot[];
  commission?:    CommissionMember[]; // только если isCommission = true
}

export interface GradebookRetakePending extends GradebookBase {
  state:         "failed_retake_pending";
  attemptNumber: 1 | 2 | 3;
  isCommission:  boolean;
}

export interface GradebookFailed extends GradebookBase {
  state: "failed_final";
}

// ---------------------------------------------------------------------------
// Состав комиссии (для пересдачи комиссии)
// ---------------------------------------------------------------------------

export interface CommissionMember {
  name:     string;
  position: string;
}
