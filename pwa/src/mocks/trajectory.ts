import type {
  Person, Learner, UnitLeaf, UnitGroup,
  TrajectoryLesson, EduEvent, Control, DeferredObligation, BRS,
  Department,
} from "@eios/contracts";
import { PersonId, LearnerId, UnitId, SlotId, EventId, ObligationId } from "@eios/contracts";

// ── Shared slot IDs (must match schedule mock) ───────────────────────────────
export const SLOT = {
  // ВО — Базы данных
  L1:  SlotId("l1"),  L2:  SlotId("l2"),  L3:  SlotId("l3"),  L4:  SlotId("l4"),
  L5:  SlotId("l5"),  L6:  SlotId("l6"),  L7:  SlotId("l7"),  L8:  SlotId("l8"),
  // ВО — Математический анализ
  L9:  SlotId("l9"),  L10: SlotId("l10"), L11: SlotId("l11"), L12: SlotId("l12"),
  L13: SlotId("l13"),
  // ВО — Правовое регулирование
  L14: SlotId("l14"), L15: SlotId("l15"), L16: SlotId("l16"),
  // СПО — МДК.01.01
  SL1:  SlotId("sl1"),  SL2:  SlotId("sl2"),  SL3:  SlotId("sl3"),  SL4:  SlotId("sl4"),
  SL5:  SlotId("sl5"),  SL6:  SlotId("sl6"),  SL7:  SlotId("sl7"),  SL8:  SlotId("sl8"),
  // СПО — МДК.01.02
  SL9:  SlotId("sl9"),  SL10: SlotId("sl10"), SL11: SlotId("sl11"), SL12: SlotId("sl12"),
  SL13: SlotId("sl13"), SL14: SlotId("sl14"),
};

// Shared unit IDs (must match gradebook mock)
export const UNIT_IDS = {
  DB:     UnitId("unit_db"),
  MATH:   UnitId("unit_math"),
  LAW:    UnitId("unit_law"),
  PM01:   UnitId("unit_pm01"),
  MDK0101:UnitId("unit_mdk0101"),
  MDK0102:UnitId("unit_mdk0102"),
  UP01:   UnitId("unit_up01"),
  PM02:   UnitId("unit_pm02"),
  MDK0201:UnitId("unit_mdk0201"),
  PP01:   UnitId("unit_pp01"),
};

// ── Departments ───────────────────────────────────────────────────────────────
const DEPT_PI:  Department = { name: "Кафедра прикладной информатики" };
const DEPT_VM:  Department = { name: "Кафедра высшей математики" };
const DEPT_GP:  Department = { name: "Кафедра гражданского права" };
const DEPT_PCT: Department = { name: "ПЦК информационных технологий" };

// ── Control helpers ───────────────────────────────────────────────────────────
type AttRes = "присутствовал" | "отсутствовал_уважит" | "отсутствовал";
function att(r: AttRes): Control { return { form: "посещаемость", role: "обязательная", result: r }; }
function cur(score: number, maxScore: number): Control { return { form: "текущий", role: "обязательная", score, maxScore }; }
function modCtrl(score: number, maxScore: number): Control { return { form: "модульный", role: "обязательная", score, maxScore }; }
const ATT_EMPTY: Control = { form: "посещаемость", role: "обязательная" };
const CUR_EMPTY = (maxScore: number): Control => ({ form: "текущий", role: "обязательная", maxScore });
function ev(id: string): EduEvent["eventId"] { return EventId(id); }
function obl(id: string, label: string, deadline?: string, status: DeferredObligation["status"] = "open"): DeferredObligation {
  return { obligationId: ObligationId(id), label, deadline, status };
}

// ── ВО: Базы данных ───────────────────────────────────────────────────────────
const DB_BRS: BRS = {
  currentControl: 18, maxCurrentControl: 40,
  assessment: 24,     maxAssessment: 50,
  total: 42,          maxTotal: 100,
  breakdown: [
    { form: "посещаемость", label: "Посещаемость",      score: 3,  max: 5,  unit: "занятий" },
    { form: "текущий",      label: "Текущий контроль",  score: 15, max: 35 },
    { form: "модульный",    label: "Рубежный контроль", score: 24, max: 50 },
  ],
};

const UNIT_DB: UnitLeaf = {
  kind: "unit",
  unitId: UNIT_IDS.DB,
  code: "Б1.О.16",
  title: "Базы данных",
  dept: DEPT_PI,
  unitType: "course",
  lessonCounts: { lec: 4, prac: 2, lab: 2 },
  brs: DB_BRS,
  finalControl: { type: "экзамен", date: { confirmed: false, value: "2027-01-15" } },
  lessons: [
    { lessonId: SLOT.L1, sequenceNum: 1, lessonType: "лекция",   topic: "Реляционная модель данных",        status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_l1"),  kind: "занятие", controls: [att("присутствовал"),         cur(88, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.L2, sequenceNum: 2, lessonType: "практика", topic: "SQL: SELECT и JOIN",                status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_l2"),  kind: "занятие", controls: [att("присутствовал"),         cur(74, 100)],
        deferredObligations: [obl("obl_l2_code", "Доработка запроса по итогам ревью", "2026-06-20")] }] },
    { lessonId: SLOT.L3, sequenceNum: 3, lessonType: "лекция",   topic: "Нормализация и денормализация",     status: "done",      accessPolicy: "public",
      events: [
        { eventId: ev("ev_l3a"), kind: "занятие", controls: [att("присутствовал"), cur(18, 20)], deferredObligations: [] },
        { eventId: ev("ev_l3b"), kind: "модуль",  label: "Модуль 1", controls: [modCtrl(42, 50)], deferredObligations: [] },
      ] },
    { lessonId: SLOT.L4, sequenceNum: 4, lessonType: "лаб",      topic: "Проектирование схемы БД",           status: "done",      accessPolicy: "campus_only",
      packageUrl: "/api/scorm/pkg_db_lab1",
      events: [{ eventId: ev("ev_l4"),  kind: "занятие", controls: [att("присутствовал"),         cur(65, 100)],
        deferredObligations: [obl("obl_l4_report", "Отчёт по лабораторной работе", "2026-06-15")] }] },
    { lessonId: SLOT.L5, sequenceNum: 5, lessonType: "лекция",   topic: "Индексы и оптимизация запросов",    status: "available", accessPolicy: "public",
      events: [{ eventId: ev("ev_l5"),  kind: "занятие",
        controls: [ATT_EMPTY, CUR_EMPTY(100)],
        deferredObligations: [obl("obl_l5_hw", "Домашнее задание", "2026-07-10")] }] },
    { lessonId: SLOT.L6, sequenceNum: 6, lessonType: "практика", topic: "Транзакции и блокировки",           status: "future",    accessPolicy: "public",    events: [] },
    { lessonId: SLOT.L7, sequenceNum: 7, lessonType: "лаб",      topic: "Работа с PostgreSQL",               status: "future",    accessPolicy: "campus_only", events: [] },
    { lessonId: SLOT.L8, sequenceNum: 8, lessonType: "лекция",   topic: "NoSQL: MongoDB",                    status: "future",    accessPolicy: "public",    events: [] },
  ],
};

// ── ВО: Математический анализ ─────────────────────────────────────────────────
const UNIT_MATH: UnitLeaf = {
  kind: "unit",
  unitId: UNIT_IDS.MATH,
  code: "Б1.О.07",
  title: "Математический анализ",
  dept: DEPT_VM,
  unitType: "course",
  lessonCounts: { lec: 3, prac: 2, lab: 0 },
  brs: {
    currentControl: 14, maxCurrentControl: 40,
    assessment: 14,     maxAssessment: 50,
    total: 28,          maxTotal: 100,
    breakdown: [
      { form: "посещаемость", label: "Посещаемость",      score: 2,  max: 5,  unit: "занятий" },
      { form: "текущий",      label: "Текущий контроль",  score: 12, max: 35 },
      { form: "модульный",    label: "Рубежный контроль", score: 14, max: 50 },
    ],
  },
  finalControl: { type: "экзамен", date: { confirmed: true, value: "2027-01-20" } },
  lessons: [
    { lessonId: SLOT.L9,  sequenceNum: 1, lessonType: "лекция",   topic: "Производные и их применение",       status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_l9"),  kind: "занятие", controls: [att("отсутствовал_уважит"), cur(55, 100)],
        deferredObligations: [obl("obl_l9_catch", "Проработка пропущенного материала", "2026-07-01")] }] },
    { lessonId: SLOT.L10, sequenceNum: 2, lessonType: "практика", topic: "Интегрирование по частям",          status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_l10"), kind: "занятие", controls: [att("присутствовал"),        cur(82, 100)],
        deferredObligations: [obl("obl_l10_hw", "Домашнее задание", undefined, "submitted")] }] },
    { lessonId: SLOT.L11, sequenceNum: 3, lessonType: "лекция",   topic: "Ряды Фурье",                        status: "available", accessPolicy: "public",
      events: [{ eventId: ev("ev_l11"), kind: "занятие", controls: [ATT_EMPTY, CUR_EMPTY(100)], deferredObligations: [] }] },
    { lessonId: SLOT.L12, sequenceNum: 4, lessonType: "практика", topic: "Дифференциальные уравнения",        status: "future",    accessPolicy: "public",    events: [] },
    { lessonId: SLOT.L13, sequenceNum: 5, lessonType: "лекция",   topic: "Функции комплексного переменного",  status: "future",    accessPolicy: "public",    events: [] },
  ],
};

// ── ВО: Правовое регулирование ────────────────────────────────────────────────
const UNIT_LAW: UnitLeaf = {
  kind: "unit",
  unitId: UNIT_IDS.LAW,
  code: "Б1.О.23",
  title: "Правовое регулирование в сфере ИТ",
  dept: DEPT_GP,
  unitType: "course",
  lessonCounts: { lec: 2, prac: 1, lab: 0 },
  brs: {
    currentControl: 36, maxCurrentControl: 40,
    assessment: 25,     maxAssessment: 50,
    total: 61,          maxTotal: 100,
    breakdown: [
      { form: "посещаемость", label: "Посещаемость",      score: 5,  max: 5,  unit: "занятий" },
      { form: "текущий",      label: "Текущий контроль",  score: 31, max: 35 },
      { form: "модульный",    label: "Рубежный контроль", score: 25, max: 50 },
    ],
  },
  finalControl: { type: "зачёт", date: { confirmed: false, value: "2027-01-10" } },
  lessons: [
    { lessonId: SLOT.L14, sequenceNum: 1, lessonType: "лекция",   topic: "Гражданское право: основы",         status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_l14"), kind: "занятие", controls: [att("присутствовал"), cur(70, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.L15, sequenceNum: 2, lessonType: "практика", topic: "Составление договоров",             status: "available", accessPolicy: "public",
      events: [{ eventId: ev("ev_l15"), kind: "занятие", controls: [ATT_EMPTY, CUR_EMPTY(100)],         deferredObligations: [] }] },
    { lessonId: SLOT.L16, sequenceNum: 3, lessonType: "лекция",   topic: "Интеллектуальная собственность",    status: "future",    accessPolicy: "public",    events: [] },
  ],
};

// ── СПО: МДК.01.01 ───────────────────────────────────────────────────────────
const UNIT_MDK0101: UnitLeaf = {
  kind: "unit",
  unitId: UNIT_IDS.MDK0101,
  code: "МДК.01.01",
  title: "Разработка ПО на языках высокого уровня",
  dept: DEPT_PCT,
  unitType: "course",
  lessonCounts: { lec: 4, prac: 6, lab: 4 },
  brs: {
    currentControl: 25, maxCurrentControl: 40,
    assessment: 30,     maxAssessment: 50,
    total: 55,          maxTotal: 100,
    breakdown: [
      { form: "посещаемость", label: "Посещаемость",      score: 4,  max: 5,  unit: "занятий" },
      { form: "текущий",      label: "Текущий контроль",  score: 21, max: 35 },
      { form: "модульный",    label: "Рубежный контроль", score: 30, max: 50 },
    ],
  },
  finalControl: { type: "дифзачёт", date: { confirmed: true, value: "2026-04-15" } },
  lessons: [
    { lessonId: SLOT.SL1, sequenceNum: 1, lessonType: "лекция",   topic: "Введение в Python",               status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_sl1"), kind: "занятие", controls: [att("присутствовал"), cur(90, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.SL2, sequenceNum: 2, lessonType: "практика", topic: "ООП: классы и объекты",           status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_sl2"), kind: "занятие", controls: [att("присутствовал"), cur(75, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.SL3, sequenceNum: 3, lessonType: "лаб",      topic: "Разработка простого приложения",  status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_sl3"), kind: "занятие", controls: [att("присутствовал"), cur(88, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.SL4, sequenceNum: 4, lessonType: "лекция",   topic: "Работа с файлами и исключениями", status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_sl4"), kind: "занятие", controls: [att("отсутствовал_уважит"), cur(62, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.SL5, sequenceNum: 5, lessonType: "практика", topic: "Работа с БД из Python",           status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_sl5"), kind: "занятие", controls: [att("присутствовал"), cur(80, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.SL6, sequenceNum: 6, lessonType: "лаб",      topic: "Создание REST API",                status: "available", accessPolicy: "campus_only",
      packageUrl: "/api/scorm/pkg_py_rest",
      events: [{ eventId: ev("ev_sl6"), kind: "занятие", controls: [ATT_EMPTY, CUR_EMPTY(100)], deferredObligations: [] }] },
    { lessonId: SLOT.SL7, sequenceNum: 7, lessonType: "лекция",   topic: "Паттерны проектирования",         status: "future",    accessPolicy: "public",    events: [] },
    { lessonId: SLOT.SL8, sequenceNum: 8, lessonType: "практика", topic: "Финальный проект",                status: "future",    accessPolicy: "public",    events: [] },
  ],
};

// ── СПО: МДК.01.02 ───────────────────────────────────────────────────────────
const UNIT_MDK0102: UnitLeaf = {
  kind: "unit",
  unitId: UNIT_IDS.MDK0102,
  code: "МДК.01.02",
  title: "Тестирование программных модулей",
  dept: DEPT_PCT,
  unitType: "course",
  lessonCounts: { lec: 2, prac: 4, lab: 0 },
  brs: {
    currentControl: 18, maxCurrentControl: 40,
    assessment: 20,     maxAssessment: 50,
    total: 38,          maxTotal: 100,
    breakdown: [
      { form: "посещаемость", label: "Посещаемость",      score: 3,  max: 5,  unit: "занятий" },
      { form: "текущий",      label: "Текущий контроль",  score: 15, max: 35 },
      { form: "модульный",    label: "Рубежный контроль", score: 20, max: 50 },
    ],
  },
  finalControl: { type: "зачёт", date: { confirmed: false, value: "2026-05-22" } },
  lessons: [
    { lessonId: SLOT.SL9,  sequenceNum: 1, lessonType: "лекция",   topic: "Виды тестирования ПО",       status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_sl9"),  kind: "занятие", controls: [att("присутствовал"), cur(70, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.SL10, sequenceNum: 2, lessonType: "практика", topic: "Unit-тестирование с pytest",  status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_sl10"), kind: "занятие", controls: [att("присутствовал"), cur(85, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.SL11, sequenceNum: 3, lessonType: "практика", topic: "Интеграционное тестирование", status: "done",      accessPolicy: "public",
      events: [{ eventId: ev("ev_sl11"), kind: "занятие", controls: [att("присутствовал"), cur(60, 100)], deferredObligations: [] }] },
    { lessonId: SLOT.SL12, sequenceNum: 4, lessonType: "практика", topic: "Тестирование REST API",       status: "available", accessPolicy: "public",
      events: [{ eventId: ev("ev_sl12"), kind: "занятие", controls: [ATT_EMPTY, CUR_EMPTY(100)],          deferredObligations: [] }] },
    { lessonId: SLOT.SL13, sequenceNum: 5, lessonType: "лекция",   topic: "Нагрузочное тестирование",    status: "future",    accessPolicy: "public",    events: [] },
    { lessonId: SLOT.SL14, sequenceNum: 6, lessonType: "практика", topic: "Автоматизация тестирования",  status: "future",    accessPolicy: "public",    events: [] },
  ],
};

// ── СПО: УП.01 (учебная практика) ────────────────────────────────────────────
const UNIT_UP01: UnitLeaf = {
  kind: "unit",
  unitId: UNIT_IDS.UP01,
  code: "УП.01",
  title: "Учебная практика",
  dept: DEPT_PCT,
  unitType: "practice",
  lessonCounts: { days: 12 },
  brs: {
    currentControl: 4, maxCurrentControl: 12,
    assessment: null,  maxAssessment: 0,
    total: 4,          maxTotal: 12,
    breakdown: [{ form: "посещаемость", label: "Дни практики", score: 4, max: 12, unit: "дней" }],
  },
  finalControl: { type: "дифзачёт", date: { confirmed: false, value: "2026-06-05" } },
  lessons: [
    { lessonId: SlotId("up01_d1"), sequenceNum: 1, lessonType: "день_практики", topic: "Знакомство с предприятием",    status: "done",   accessPolicy: "public", events: [{ eventId: ev("ev_up1"), kind: "занятие", controls: [att("присутствовал")], deferredObligations: [] }] },
    { lessonId: SlotId("up01_d2"), sequenceNum: 2, lessonType: "день_практики", topic: "Изучение стека технологий",   status: "done",   accessPolicy: "public", events: [{ eventId: ev("ev_up2"), kind: "занятие", controls: [att("присутствовал")], deferredObligations: [] }] },
    { lessonId: SlotId("up01_d3"), sequenceNum: 3, lessonType: "день_практики", topic: "Выполнение задания",          status: "done",   accessPolicy: "public", events: [{ eventId: ev("ev_up3"), kind: "занятие", controls: [att("присутствовал")], deferredObligations: [] }] },
    { lessonId: SlotId("up01_d4"), sequenceNum: 4, lessonType: "день_практики", topic: "Защита промежуточного этапа", status: "done",   accessPolicy: "public", events: [{ eventId: ev("ev_up4"), kind: "занятие", controls: [att("присутствовал")], deferredObligations: [] }] },
    { lessonId: SlotId("up01_d5"), sequenceNum: 5, lessonType: "день_практики", topic: "День 5",                     status: "future", accessPolicy: "public", events: [] },
  ],
};

// ── СПО: ПМ.01 ───────────────────────────────────────────────────────────────
const UNIT_PM01: UnitGroup = {
  kind: "group",
  unitId: UNIT_IDS.PM01,
  code: "ПМ.01",
  title: "Разработка программного обеспечения",
  dept: DEPT_PCT,
  finalControl: { type: "ЭК", date: { confirmed: false, value: "2026-06-14" } },
  children: [UNIT_MDK0101, UNIT_MDK0102, UNIT_UP01],
};

// ── СПО: ПМ.02 ───────────────────────────────────────────────────────────────
const UNIT_PM02: UnitGroup = {
  kind: "group",
  unitId: UNIT_IDS.PM02,
  code: "ПМ.02",
  title: "Сопровождение и обслуживание ПО",
  dept: DEPT_PCT,
  finalControl: { type: "ЭК", date: { confirmed: false, value: "2027-01-18" } },
  children: [
    {
      kind: "unit",
      unitId: UNIT_IDS.MDK0201,
      code: "МДК.02.01",
      title: "Инструментальные средства разработки ПО",
      dept: DEPT_PCT,
      unitType: "course",
      lessonCounts: { lec: 2, prac: 4, lab: 0 },
      brs: { currentControl: 0, maxCurrentControl: 40, assessment: null, maxAssessment: 50, total: 0, maxTotal: 100, breakdown: [] },
      finalControl: { type: "дифзачёт", date: { confirmed: false, value: "2027-01-10" } },
      lessons: [],
    },
    {
      kind: "unit",
      unitId: UNIT_IDS.PP01,
      code: "ПП.01",
      title: "Производственная практика",
      dept: DEPT_PCT,
      unitType: "practice",
      lessonCounts: { days: 24 },
      brs: { currentControl: 0, maxCurrentControl: 24, assessment: null, maxAssessment: 0, total: 0, maxTotal: 24, breakdown: [] },
      finalControl: { type: "дифзачёт", date: { confirmed: false, value: "2027-01-18" } },
      lessons: [],
    },
  ],
};

// ── Learners ──────────────────────────────────────────────────────────────────
export const LEARNER_VO: Learner = {
  learnerId: LearnerId("learner_vo_1"),
  programType: "ВО",
  programTitle: "Информационные системы и технологии",
  speciality: "09.03.02 Информационные системы и технологии",
  group: "ИСТ-41",
  course: 4,
  form: "очная",
  period: "2025-2026-spring",
  periodLabel: "Весенний семестр 2026",
  studentBookNumber: "20-223145",
  units: [UNIT_DB, UNIT_MATH, UNIT_LAW],
};

export const LEARNER_SPO: Learner = {
  learnerId: LearnerId("learner_spo_1"),
  programType: "СПО",
  programTitle: "Информационные системы (по отраслям)",
  speciality: "09.02.07 Информационные системы и программирование",
  group: "ИС-31",
  course: 2,
  form: "очная",
  period: "2025-2026-spring",
  periodLabel: "СПО · 3 семестр 2025–2026",
  studentBookNumber: "СПО-2023-0147",
  units: [UNIT_PM01, UNIT_PM02],
};

// ── Person: Студент ───────────────────────────────────────────────────────────
export const MOCK_PERSON: Person = {
  personId: PersonId("person_001"),
  personType: "student",
  firstName: "Иван",
  lastName: "Иванов",
  patronymic: "Иванович",
  eiv: "260001",
  learners: [LEARNER_VO, LEARNER_SPO],
};

// ── Person: Родитель ──────────────────────────────────────────────────────────
// Наблюдает за обучением дочери (LEARNER_VO)
export const MOCK_PERSON_PARENT: Person = {
  personId: PersonId("person_002"),
  personType: "parent",
  firstName: "Наталья",
  lastName: "Иванова",
  patronymic: "Александровна",
  eiv: "260002",
  learners: [],
  children: [LEARNER_VO],
};
