/**
 * Слой данных — ЕДИНСТВЕННАЯ граница между UI и источником.
 *
 * Сейчас всё возвращает моки. Когда появится реальный API — реализация
 * меняется ЗДЕСЬ, компоненты не трогаем.
 *
 * Принцип: UI получает данные ОТСЮДА, не через пропы из родителя
 * (раньше DemoShell прокидывал моки в Shell/TeacherShell — антипаттерн).
 *
 * См. memory: architecture.md → правило 3.
 */
import type {
  Person,
  ScheduleResponse,
  GradebookResponse,
  NotificationsResponse,
  TeacherScheduleResponse,
  AttendanceResponse,
} from "@eios/contracts";
import {
  MOCK_PERSON,
  MOCK_PERSON_PARENT,
  LEARNER_VO,
  LEARNER_SPO,
  MOCK_SCHEDULE_VO,
  MOCK_GRADEBOOK_VO,
  MOCK_GRADEBOOK_SPO,
  MOCK_NOTIFICATIONS,
  MOCK_TEACHER_SCHEDULE,
  MOCK_ATTENDANCE,
} from "../mocks/index.js";

export type Role = "student" | "parent" | "teacher";

// ── Студент / родитель ────────────────────────────────────────────────────────

export function getPerson(role: Role): Person {
  return role === "parent" ? MOCK_PERSON_PARENT : MOCK_PERSON;
}

export function getScheduleMap(): Map<string, ScheduleResponse> {
  return new Map([
    [LEARNER_VO.learnerId, MOCK_SCHEDULE_VO],
    [LEARNER_SPO.learnerId, MOCK_SCHEDULE_VO],
  ]);
}

export function getGradebookMap(): Map<string, GradebookResponse> {
  return new Map([
    [LEARNER_VO.learnerId, MOCK_GRADEBOOK_VO],
    [LEARNER_SPO.learnerId, MOCK_GRADEBOOK_SPO],
  ]);
}

export function getNotifications(): NotificationsResponse {
  return MOCK_NOTIFICATIONS;
}

// ── Педагог ───────────────────────────────────────────────────────────────────

export function getTeacherSchedule(): TeacherScheduleResponse {
  return MOCK_TEACHER_SCHEDULE;
}

export function getAttendance(): Record<string, AttendanceResponse> {
  return MOCK_ATTENDANCE;
}

/**
 * Идентичность педагога: ФИО + ЕИВ.
 * authName != "" → реальный Auth0-юзер; пустое → демо-юзер.
 */
export function getTeacherIdentity(authName: string): { name: string; eiv: string } {
  if (authName) return { name: authName, eiv: "000000" }; // TODO: ЕИВ из Univerkon
  return { name: "Петров Иван Сергеевич", eiv: "260001" };
}
