// Контракт расписания: GET /eios/student/{learnerId}/schedule
// Только реализационные данные (время, аудитория, педагог).
// Содержание занятия — в TrajectoryLesson (связь по SlotId).
import type { LearnerId, SlotId, UnitId } from "./ids.js";
import type { RatingCriterion } from "./trajectory.js";

// ---------------------------------------------------------------------------
// Ответ API расписания
// ---------------------------------------------------------------------------

export type DayStatus =
  | "working" | "weekend" | "holiday" | "vacation" | "session";

export interface ScheduleResponse {
  learnerId: LearnerId;
  from: string;           // ISO date (YYYY-MM-DD) — вчера или начало недели
  to:   string;           // ISO date — конец следующей недели
  days: ScheduleDay[];
}

export interface ScheduleDay {
  date:    string;        // YYYY-MM-DD
  weekday: string;        // локализованное название дня
  status:  DayStatus;
  label?:  string;        // "День Победы", "Летние каникулы"
  slots:   ScheduleSlot[];
}

export interface ScheduleSlot {
  slotId:     SlotId;     // совпадает с TrajectoryLesson.lessonId
  timeStart:  string;     // "09:00"
  timeEnd:    string;     // "10:30"
  room?:      string;
  isOnline:   boolean;
  teacher:    Teacher;
  unitRef:    UnitRef;
  hasControl: boolean;    // есть модульный контроль в этом слоте
  rating:     SlotRating | null; // null если LESSON_RATING_ENABLED = false
}

export interface Teacher {
  name:     string;
  position: string;
  degree?:  string;
}

export interface UnitRef {
  unitId:      UnitId;
  title:       string;
  groupTitle?: string;   // "ПМ.01 Разработка ПО" для СПО, null для ВО
}

export interface SlotRating {
  submitted: boolean;
  criteria:  RatingCriterion[] | null; // null если критерии не назначены
}

// ---------------------------------------------------------------------------
// Запись на слот (отработка / пересдача)
// ---------------------------------------------------------------------------

export interface BookingSlot {
  bookingSlotId:  string;
  date:           string;
  timeStart:      string;
  timeEnd:        string;
  room?:          string;
  teacher?:       Teacher;
  availableSpots: number;
}

export interface BookingRequest {
  lessonSlotId:  SlotId;  // какое занятие отрабатывается / пересдаётся
  bookingSlotId: string;  // выбранный слот записи
}

export interface BookingResponse {
  ok:            boolean;
  confirmedDate: string;
  room?:         string;
}

// ---------------------------------------------------------------------------
// Документ для уважительного прогула
// ---------------------------------------------------------------------------

export interface AbsenceDocumentRequest {
  photo: string; // base64 или URL
}

export interface AbsenceDocumentResponse {
  ok: boolean;
}
