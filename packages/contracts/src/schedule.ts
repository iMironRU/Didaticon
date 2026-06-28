// Контракт расписания студента и педагога.
// Студент: GET /eios/student/{learnerId}/schedule
// Педагог: GET /eios/teacher/{teacherId}/schedule
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

export type SlotStatus = "not_started" | "in_progress" | "completed";

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
  status?:    SlotStatus; // отсутствие = not_started
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
// Расписание педагога: GET /eios/teacher/{teacherId}/schedule
// ---------------------------------------------------------------------------

export type RefuseReason = "illness" | "business_trip" | "other";

export interface TeacherSlotGroup {
  groupId: string;
  title:   string;   // "ИВТ-22"
  count:   number;   // кол-во студентов
}

export interface TeacherScheduleSlot {
  slotId:     SlotId;
  timeStart:  string;
  timeEnd:    string;
  room?:      string;
  isOnline:   boolean;
  unitRef:    UnitRef;
  lessonKind: string;   // "Лекция" | "Практика" | "Лабораторная" | …
  groups:     TeacherSlotGroup[];
  status:     SlotStatus;
  canRefuse:  boolean;  // false если дата занятия == сегодня
}

export interface TeacherScheduleDay {
  date:    string;
  weekday: string;
  status:  DayStatus;
  slots:   TeacherScheduleSlot[];
}

export interface TeacherScheduleResponse {
  teacherId: string;
  from:      string;
  to:        string;
  days:      TeacherScheduleDay[];
}

export interface RefuseRequest {
  slotId: SlotId;
  reason: RefuseReason;
}

// ---------------------------------------------------------------------------
// Посещаемость: GET /eios/teacher/{teacherId}/slot/{slotId}/attendance
// ---------------------------------------------------------------------------

export interface AttendanceStudent {
  studentId: string;
  name:      string;
  absent:    boolean;
}

export interface AttendanceResponse {
  slotId:   SlotId;
  students: AttendanceStudent[];
}

export interface AttendanceSaveRequest {
  slotId:    SlotId;
  absentIds: string[];   // только отсутствующие
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
