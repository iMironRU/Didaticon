import type { ScheduleResponse, ScheduleDay, ScheduleSlot, Teacher, UnitRef, SlotRating, SlotId } from "@eios/contracts";
import type { RatingCriterion } from "@eios/contracts";
import { LearnerId } from "@eios/contracts";
import { SLOT, UNIT_IDS } from "./trajectory.js";

// ── Rating criteria ───────────────────────────────────────────────────────────
export const RATING_CRITERIA: RatingCriterion[] = [
  { id: "rc1", label: "Материал понятен и доступен",    teacherRelated: false },
  { id: "rc2", label: "Занятие хорошо структурировано", teacherRelated: false },
  { id: "rc3", label: "Преподаватель хорошо объясняет", teacherRelated: true  },
];

const RATED:   SlotRating = { submitted: true,  criteria: null           };
const RATABLE: SlotRating = { submitted: false, criteria: RATING_CRITERIA };

// ── Teachers ──────────────────────────────────────────────────────────────────
const T_PETROV:   Teacher = { name: "Петров Иван Сергеевич",     position: "Доцент",               degree: "к.т.н."    };
const T_SIDOROV:  Teacher = { name: "Сидоров Алексей Юрьевич",  position: "Старший преподаватель"                      };
const T_SMIRNOVA: Teacher = { name: "Смирнова Анна Викторовна", position: "Профессор",             degree: "д.ф.-м.н." };
const T_KOZLOV:   Teacher = { name: "Козлов Пётр Дмитриевич",   position: "Доцент",               degree: "к.ю.н."    };

// ── Unit refs ─────────────────────────────────────────────────────────────────
const REF_DB:   UnitRef = { unitId: UNIT_IDS.DB,   title: "Базы данных" };
const REF_MATH: UnitRef = { unitId: UNIT_IDS.MATH, title: "Математический анализ" };
const REF_LAW:  UnitRef = { unitId: UNIT_IDS.LAW,  title: "Правовое регулирование в сфере ИТ" };

// ── Schedule slot builder ─────────────────────────────────────────────────────
function s(
  slotId: SlotId,
  timeStart: string, timeEnd: string,
  teacher: Teacher,
  unitRef: UnitRef,
  room: string | undefined,
  isOnline: boolean,
  hasControl: boolean,
  rating: SlotRating | null,
): ScheduleSlot {
  return { slotId, timeStart, timeEnd, room, isOnline, teacher, unitRef, hasControl, rating };
}

// ── 2-week window for ВО learner: Jun 20 – Jul 7, 2026 ───────────────────────
// TODAY = 2026-06-27 (Saturday)
const DAYS_VO: ScheduleDay[] = [
  { date: "2026-06-20", weekday: "Суббота",    status: "weekend", slots: [
    s(SLOT.L1,  "09:00", "10:30", T_PETROV,   REF_DB,   "Ауд. 101", false, false, RATED),
  ]},
  { date: "2026-06-21", weekday: "Воскресенье",status: "weekend", slots: [
    s(SLOT.L9,  "11:00", "12:30", T_SMIRNOVA, REF_MATH, "Ауд. 204", false, false, RATED),
  ]},
  { date: "2026-06-22", weekday: "Понедельник", status: "working", slots: [
    s(SLOT.L2,  "11:00", "12:30", T_SIDOROV,  REF_DB,   "Ауд. 312", false, false, RATED),
  ]},
  { date: "2026-06-23", weekday: "Вторник",    status: "working", slots: [
    s(SLOT.L14, "13:00", "14:30", T_KOZLOV,   REF_LAW,  "Ауд. 118", false, false, RATED),
  ]},
  { date: "2026-06-24", weekday: "Среда",      status: "working", slots: [
    s(SLOT.L3,  "09:00", "10:30", T_PETROV,   REF_DB,   "Ауд. 101", false, true,  RATED),
  ]},
  { date: "2026-06-25", weekday: "Четверг",    status: "working", slots: [
    s(SLOT.L10, "09:00", "10:30", T_SMIRNOVA, REF_MATH, "Ауд. 204", false, false, RATED),
  ]},
  { date: "2026-06-26", weekday: "Пятница",    status: "working", slots: [
    s(SLOT.L4,  "13:00", "14:30", T_SIDOROV,  REF_DB,   "Ауд. 215", false, false, RATABLE),
  ]},
  { date: "2026-06-27", weekday: "Суббота",    status: "working", slots: [
    s(SLOT.L5,  "09:00", "10:30", T_PETROV,   REF_DB,   "Ауд. 101", false, false, RATABLE),
  ]},
  { date: "2026-06-28", weekday: "Воскресенье",status: "weekend", slots: [
    s(SLOT.L11, "11:00", "12:30", T_SMIRNOVA, REF_MATH, "Ауд. 204", false, false, RATABLE),
  ]},
  { date: "2026-06-29", weekday: "Понедельник",status: "working", slots: [
    s(SLOT.L6,  "11:00", "12:30", T_SIDOROV,  REF_DB,   "Ауд. 312", false, false, null),
  ]},
  { date: "2026-06-30", weekday: "Вторник",    status: "working", slots: [
    s(SLOT.L15, "13:00", "14:30", T_KOZLOV,   REF_LAW,  "Ауд. 118", false, false, null),
  ]},
  { date: "2026-07-01", weekday: "Среда",      status: "working", slots: [
    s(SLOT.L12, "09:00", "10:30", T_SMIRNOVA, REF_MATH, "Ауд. 204", false, false, null),
  ]},
  { date: "2026-07-02", weekday: "Четверг",    status: "working", slots: [
    s(SLOT.L7,  "13:00", "14:30", T_SIDOROV,  REF_DB,   "Ауд. 215", false, false, null),
  ]},
  { date: "2026-07-03", weekday: "Пятница",    status: "working", slots: [] },
  { date: "2026-07-04", weekday: "Суббота",    status: "weekend", slots: [
    s(SLOT.L8,  "09:00", "10:30", T_PETROV,   REF_DB,   "Ауд. 101", false, false, null),
  ]},
  { date: "2026-07-05", weekday: "Воскресенье",status: "weekend", slots: [
    s(SLOT.L13, "11:00", "12:30", T_SMIRNOVA, REF_MATH, "Ауд. 204", false, false, null),
  ]},
  { date: "2026-07-06", weekday: "Понедельник",status: "working", slots: [] },
  { date: "2026-07-07", weekday: "Вторник",    status: "working", slots: [
    s(SLOT.L16, "13:00", "14:30", T_KOZLOV,   REF_LAW,  "Ауд. 118", false, false, null),
  ]},
];

export const MOCK_SCHEDULE_VO: ScheduleResponse = {
  learnerId: LearnerId("learner_vo_1"),
  from: "2026-06-20",
  to: "2026-07-07",
  days: DAYS_VO,
};
