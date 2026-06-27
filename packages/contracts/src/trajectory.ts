// Контракт траектории студента: полная иерархия Person → Learner → Unit → Slot → Event
import type { PersonId, LearnerId, UnitId, SlotId, EventId, ObligationId } from "./ids.js";

// ---------------------------------------------------------------------------
// Person (физическое лицо)
// ---------------------------------------------------------------------------

export type PersonType = "student" | "parent";

export interface Person {
  personId: PersonId;
  personType: PersonType;
  firstName: string;
  lastName: string;
  patronymic?: string;
  photo?: string;            // URL из OIDC userinfo
  eiv: string;               // Единый идентификатор вуза (6 знаков)
  learners: Learner[];       // собственные записи контингента (для student)
  children?: Learner[];      // дети (для parent)
}

// ---------------------------------------------------------------------------
// Learner (обучающийся — запись контингента)
// ---------------------------------------------------------------------------

export type ProgramType = "ВО" | "СПО" | "ДО" | "ДПО";
export type StudyForm   = "очная" | "заочная" | "очно-заочная";

export interface Learner {
  learnerId: LearnerId;
  programType: ProgramType;
  programTitle: string;
  speciality: string;
  group: string;
  course: number;
  form: StudyForm;
  period: string;            // "2025-2026-spring"
  periodLabel: string;       // "Осенний семестр 2026"
  studentBookNumber?: string;
  curatorMessengerUrl?: string;
  units: CurriculumUnit[];
}

// ---------------------------------------------------------------------------
// CurriculumUnit — единица учебного плана
// ---------------------------------------------------------------------------

export type CurriculumUnit = UnitGroup | UnitLeaf;

/** Группирующий узел — только ПМ в СПО */
export interface UnitGroup {
  kind: "group";
  unitId: UnitId;
  code: string;              // "ПМ.01"
  title: string;
  dept: Department;
  finalControl: PlannedControl;
  messengerUrl?: string;
  rpdUrl?: string;
  children: UnitLeaf[];
}

/** Листовой узел — дисциплина / МДК / УП / ПП / модуль ДО/ДПО */
export interface UnitLeaf {
  kind: "unit";
  unitId: UnitId;
  code: string;
  title: string;
  dept: Department;
  unitType: "course" | "practice";
  lessonCounts: CourseCounts | PracticeCounts;
  brs: BRS;
  finalControl: PlannedControl;
  messengerUrl?: string;
  rpdUrl?: string;
  lessons: TrajectoryLesson[];
}

export interface Department {
  name: string;
  url?: string;
}

export interface CourseCounts  { lec: number; prac: number; lab: number }
export interface PracticeCounts { days: number }

// ---------------------------------------------------------------------------
// БРС (агрегат от Univerkon, ЭИОС не считает)
// ---------------------------------------------------------------------------

export interface BRS {
  currentControl:    number;
  maxCurrentControl: number;
  assessment:        number | null;
  maxAssessment:     number;
  total:             number;
  maxTotal:          number;
  breakdown:         BRSBreakdownItem[];
}

export interface BRSBreakdownItem {
  form:   string;   // "посещаемость" | "текущий" | "модульный"
  label:  string;   // локализованное название
  score:  number;
  max:    number;
  unit?:  string;   // "занятий" — для посещаемости
}

// ---------------------------------------------------------------------------
// Итоговый контроль (плановый — без результата)
// ---------------------------------------------------------------------------

export type FinalControlType =
  | "экзамен" | "зачёт" | "дифзачёт" | "ЭК" | "курсовая";

export interface PlannedControl {
  type: FinalControlType;
  date?: { confirmed: boolean; value: string }; // ISO date
}

// ---------------------------------------------------------------------------
// Занятие в траектории (без времени/аудитории — только план)
// ---------------------------------------------------------------------------

export type LessonType =
  | "лекция" | "практика" | "лаб" | "день_практики";

export type LessonStatus = "done" | "available" | "future";

export type AccessPolicy = "public" | "campus_only";

export interface TrajectoryLesson {
  lessonId:     SlotId;       // ключ связки с расписанием
  sequenceNum:  number;
  lessonType:   LessonType;
  topic:        string;
  status:       LessonStatus;
  accessPolicy: AccessPolicy;
  packageUrl?:  string;       // S3 URL (public) или /api/scorm/{id} (campus_only)
  events:       EduEvent[];
}

// ---------------------------------------------------------------------------
// Учебное событие (D04)
// ---------------------------------------------------------------------------

export type EduEventKind = "занятие" | "модуль" | "аттестация";

export interface EduEvent {
  eventId:              EventId;
  kind:                 EduEventKind;
  label?:               string;   // "Модуль 1", "ЭК"
  controls:             Control[];
  deferredObligations:  DeferredObligation[];
}

// ---------------------------------------------------------------------------
// Формы контроля
// ---------------------------------------------------------------------------

export type AttendanceResult =
  | "присутствовал" | "отсутствовал_уважит" | "отсутствовал";

export type ControlForm =
  | "посещаемость" | "текущий" | "модульный" | "итоговый";

export type ControlRole = "обязательная" | "повышающая";

export interface Control {
  form:     ControlForm;
  role:     ControlRole;
  result?:  AttendanceResult | null;  // для посещаемости
  score?:   number | null;
  maxScore?: number;
}

// ---------------------------------------------------------------------------
// Отложенные обязательства (ДЗ, лаба, реферат)
// ---------------------------------------------------------------------------

export type ObligationStatus = "open" | "submitted" | "accepted" | "rejected";

export interface DeferredObligation {
  obligationId: ObligationId;
  label:        string;          // "Домашнее задание", "Лабораторная работа"
  deadline?:    string;          // ISO date, от Univerkon
  packageUrl?:  string;          // если закрытие через SCORM
  status:       ObligationStatus;
}

// ---------------------------------------------------------------------------
// Критерии оценки занятия (приходят вместе с расписанием)
// ---------------------------------------------------------------------------

export interface RatingCriterion {
  id:             string;
  label:          string;
  teacherRelated: boolean;
}

export interface RatingSubmitRequest {
  criteria: { id: string; value: boolean }[];
}
