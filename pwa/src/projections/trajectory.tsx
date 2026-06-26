import { useState, useEffect } from "react";
import type { StudentId } from "@eios/contracts";
import { onSwUpdate, applySwUpdate } from "../sw-update.js";
import { getThemeMode, setTheme, type ThemeMode } from "../theme.js";
import { useRoute, navigate } from "../router.js";
import { useLocale, type StringKey } from "../locale.js";

// Мок ЕИВ и ФИО: в реальной интеграции приходят от Univerkon после авторизации
const MOCK_EIV = "260001";
const MOCK_STUDENT = { lastName: "Иванов", firstName: "Иван", patronymic: "Иванович" };

// ── Мок-данные ────────────────────────────────────────────────────────────────
type LessonType = "lecture" | "practice" | "lab";
type LessonStatus = "done" | "available" | "locked";

interface MockTeacher {
  name: string;
  title: string;
  degree?: string;
}

type AttendanceStatus = "present" | "absent_excused" | "absent" | "worked_off";

interface MockControl {
  form: string;
  score?: number;
  maxScore?: number;
  result?: string;
}

interface MockEvent {
  type: string;
  label?: string;
  controls: MockControl[];
}

interface MockLesson {
  id: string;
  type: LessonType;
  topic: string;
  discipline: string;
  date: Date;
  status: LessonStatus;
  score?: number;
  grade?: string;
  teacher?: MockTeacher;
  attendance?: AttendanceStatus;
  events?: MockEvent[];
}

const MOCK_LESSON_RATING_ENABLED = true;
const LESSON_RATING_CRITERIA = [
  "Материал понятен и доступен",
  "Занятие хорошо структурировано",
  "Было интересно",
];

interface BRSItem {
  label: string;
  earned: number | null;  // null = ещё не проводился
  max: number;
  note?: string;
}

interface MockDiscipline {
  id: string;
  title: string;
  totalLessons: number;
  doneLessons: number;
  grade?: string;
  lessons: MockLesson[];
  course: number;
  semester: number;
  department?: string;
  lessonCounts?: { lec?: number; prac?: number; lab?: number };
  brs?: { current: number; max: number };
  brsBreakdown?: BRSItem[];
  finalControl?: { type: string; date: string; confirmed: boolean };
}

const TODAY = new Date(2026, 5, 26); // 26 июня 2026

function d(offsetDays: number, h = 10, m = 0) {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(h, m, 0, 0);
  return dt;
}

const T_PETROV:   MockTeacher = { name: "Петров Иван Сергеевич",      title: "Доцент",                 degree: "к.т.н."     };
const T_SIDOROV:  MockTeacher = { name: "Сидоров Алексей Юрьевич",   title: "Старший преподаватель"                        };
const T_SMIRNOVA: MockTeacher = { name: "Смирнова Анна Викторовна",  title: "Профессор",              degree: "д.ф.-м.н."  };
const T_KOZLOV:   MockTeacher = { name: "Козлов Пётр Дмитриевич",    title: "Доцент",                 degree: "к.ю.н."     };

const MOCK_LESSONS: MockLesson[] = [
  {
    id: "l1", type: "lecture", topic: "Реляционная модель данных",
    discipline: "Базы данных", date: d(-7, 9), status: "done", score: 88,
    teacher: T_PETROV, attendance: "present",
    events: [{ type: "занятие", controls: [{ form: "Тест по теме", score: 88, maxScore: 100 }] }],
  },
  {
    id: "l2", type: "practice", topic: "SQL: SELECT и JOIN",
    discipline: "Базы данных", date: d(-5, 11), status: "done", score: 74,
    teacher: T_SIDOROV, attendance: "present",
    events: [{ type: "занятие", controls: [{ form: "Практическое задание", score: 74, maxScore: 100 }] }],
  },
  {
    id: "l3", type: "lecture", topic: "Нормализация и денормализация",
    discipline: "Базы данных", date: d(-3, 9), status: "done", score: 91,
    teacher: T_PETROV, attendance: "present",
    events: [
      { type: "Занятие", controls: [{ form: "Тест по теме", score: 18, maxScore: 20 }] },
      { type: "Модульный контроль", label: "Модуль 1", controls: [{ form: "Контрольная работа", score: 42, maxScore: 50 }] },
    ],
  },
  {
    id: "l4", type: "lab", topic: "Проектирование схемы БД",
    discipline: "Базы данных", date: d(-1, 13), status: "done", score: 65,
    teacher: T_SIDOROV, attendance: "worked_off",
    events: [{ type: "занятие", controls: [{ form: "Лабораторная работа", score: 65, maxScore: 100 }] }],
  },
  {
    id: "l5", type: "lecture", topic: "Индексы и оптимизация запросов",
    discipline: "Базы данных", date: d(0, 9), status: "available",
    teacher: T_PETROV,
    events: [{ type: "занятие", controls: [{ form: "Тест по теме", maxScore: 100 }] }],
  },
  { id: "l6",  type: "practice", topic: "Транзакции и блокировки",          discipline: "Базы данных",           date: d(2, 11),  status: "locked"  },
  { id: "l7",  type: "lab",      topic: "Работа с PostgreSQL",               discipline: "Базы данных",           date: d(5, 13),  status: "locked"  },
  { id: "l8",  type: "lecture",  topic: "NoSQL: MongoDB",                    discipline: "Базы данных",           date: d(7, 9),   status: "locked"  },

  {
    id: "l9", type: "lecture", topic: "Производные и их применение",
    discipline: "Математический анализ", date: d(-6, 11), status: "done", score: 55,
    teacher: T_SMIRNOVA, attendance: "absent_excused",
    events: [{ type: "занятие", controls: [{ form: "Тест по теме", score: 55, maxScore: 100 }] }],
  },
  {
    id: "l10", type: "practice", topic: "Интегрирование по частям",
    discipline: "Математический анализ", date: d(-2, 9), status: "done", score: 82,
    teacher: T_SMIRNOVA, attendance: "present",
    events: [{ type: "занятие", controls: [{ form: "Решение задач", score: 82, maxScore: 100 }] }],
  },
  {
    id: "l11", type: "lecture", topic: "Ряды Фурье",
    discipline: "Математический анализ", date: d(1, 11), status: "available",
    teacher: T_SMIRNOVA,
    events: [{ type: "занятие", controls: [{ form: "Тест по теме", maxScore: 100 }] }],
  },
  { id: "l12", type: "practice", topic: "Дифференциальные уравнения",        discipline: "Математический анализ", date: d(4, 9),   status: "locked"  },
  { id: "l13", type: "lecture",  topic: "Функции комплексного переменного",   discipline: "Математический анализ", date: d(8, 11),  status: "locked"  },

  {
    id: "l14", type: "lecture", topic: "Гражданское право: основы",
    discipline: "Правовое регулирование", date: d(-4, 13), status: "done", score: 70,
    teacher: T_KOZLOV, attendance: "present",
    events: [{ type: "занятие", controls: [{ form: "Тест по теме", score: 70, maxScore: 100 }] }],
  },
  {
    id: "l15", type: "practice", topic: "Составление договоров",
    discipline: "Правовое регулирование", date: d(3, 13), status: "available",
    teacher: T_KOZLOV,
    events: [{ type: "занятие", controls: [{ form: "Практическая работа", maxScore: 100 }] }],
  },
  { id: "l16", type: "lecture", topic: "Интеллектуальная собственность",     discipline: "Правовое регулирование", date: d(10, 13), status: "locked" },
];

const MOCK_DISCIPLINES: MockDiscipline[] = [
  {
    id: "d1", title: "Базы данных", totalLessons: 8, doneLessons: 4,
    course: 4, semester: 7,
    department: "Кафедра прикладной информатики",
    lessonCounts: { lec: 4, prac: 2, lab: 2 },
    brs: { current: 42, max: 100 },
    brsBreakdown: [
      { label: "Текущий контроль",  earned: 18, max: 40 },
      { label: "Рубежный контроль", earned: 24, max: 50 },
      { label: "Итоговый контроль", earned: null, max: 10, note: "Экзамен · 15 янв 2027" },
    ],
    finalControl: { type: "Экзамен", date: "15 янв 2027", confirmed: false },
    lessons: MOCK_LESSONS.filter(l => l.discipline === "Базы данных"),
  },
  {
    id: "d2", title: "Математический анализ", totalLessons: 5, doneLessons: 2,
    course: 4, semester: 7,
    department: "Кафедра высшей математики",
    lessonCounts: { lec: 3, prac: 2 },
    brs: { current: 28, max: 100 },
    brsBreakdown: [
      { label: "Текущий контроль",  earned: 14, max: 40 },
      { label: "Рубежный контроль", earned: 14, max: 50 },
      { label: "Итоговый контроль", earned: null, max: 10, note: "Экзамен · 20 янв 2027" },
    ],
    finalControl: { type: "Экзамен", date: "20 янв 2027", confirmed: true },
    lessons: MOCK_LESSONS.filter(l => l.discipline === "Математический анализ"),
  },
  {
    id: "d3", title: "Правовое регулирование в сфере ИТ", totalLessons: 3, doneLessons: 1,
    course: 4, semester: 8,
    department: "Кафедра гражданского права",
    lessonCounts: { lec: 2, prac: 1 },
    brs: { current: 61, max: 100 },
    brsBreakdown: [
      { label: "Текущий контроль",  earned: 36, max: 40 },
      { label: "Рубежный контроль", earned: 25, max: 50 },
      { label: "Итоговый контроль", earned: null, max: 10, note: "Зачёт · 10 янв 2027" },
    ],
    finalControl: { type: "Зачёт", date: "10 янв 2027", confirmed: false },
    lessons: MOCK_LESSONS.filter(l => l.discipline === "Правовое регулирование"),
  },
];

// ── СПО: ПМ / МДК / УП / ПП ──────────────────────────────────────────────────
interface MockMDK {
  id: string;
  code: string;
  title: string;
  department?: string;
  lessonCounts?: { lec?: number; prac?: number; lab?: number };
  brs?: { current: number; max: number };
  brsBreakdown?: BRSItem[];
  finalControl?: { type: string; date: string; confirmed: boolean };
  totalLessons: number;
  doneLessons: number;
  lessons: MockLesson[];
}

interface MockPractice {
  id: string;
  code: string;
  title: string;
  department?: string;
  totalDays: number;
  doneDays: number;
  finalControl?: { type: string; date: string; confirmed: boolean };
}

interface MockPM {
  id: string;
  code: string;
  title: string;
  department?: string;
  mdks: MockMDK[];
  practices: MockPractice[];
  finalControl?: { type: string; date: string; confirmed: boolean };
}

const MOCK_SPO_LESSONS: MockLesson[] = [
  { id: "sl1",  type: "lecture",  topic: "Введение в Python",              discipline: "МДК.01.01", date: d(-18, 9),  status: "done", score: 90, teacher: T_PETROV,  attendance: "present",   events: [{ type: "Занятие", controls: [{ form: "Тест", score: 90, maxScore: 100 }] }] },
  { id: "sl2",  type: "practice", topic: "ООП: классы и объекты",          discipline: "МДК.01.01", date: d(-15, 11), status: "done", score: 75, teacher: T_SIDOROV, attendance: "present",   events: [{ type: "Занятие", controls: [{ form: "Практическая работа", score: 75, maxScore: 100 }] }] },
  { id: "sl3",  type: "lab",      topic: "Разработка простого приложения", discipline: "МДК.01.01", date: d(-12, 13), status: "done", score: 88, teacher: T_SIDOROV, attendance: "present",   events: [{ type: "Занятие", controls: [{ form: "Лабораторная работа", score: 88, maxScore: 100 }] }] },
  { id: "sl4",  type: "lecture",  topic: "Работа с файлами и исключениями", discipline: "МДК.01.01", date: d(-9, 9),  status: "done", score: 62, teacher: T_PETROV,  attendance: "absent_excused", events: [{ type: "Занятие", controls: [{ form: "Тест", score: 62, maxScore: 100 }] }] },
  { id: "sl5",  type: "practice", topic: "Работа с БД из Python",          discipline: "МДК.01.01", date: d(-5, 11), status: "done", score: 80, teacher: T_SIDOROV, attendance: "worked_off", events: [{ type: "Занятие", controls: [{ form: "Практическая работа", score: 80, maxScore: 100 }] }] },
  { id: "sl6",  type: "lab",      topic: "Создание REST API",               discipline: "МДК.01.01", date: d(0, 13),  status: "available", teacher: T_SIDOROV, events: [{ type: "Занятие", controls: [{ form: "Лабораторная работа", maxScore: 100 }] }] },
  { id: "sl7",  type: "lecture",  topic: "Паттерны проектирования",         discipline: "МДК.01.01", date: d(3, 9),   status: "locked" },
  { id: "sl8",  type: "practice", topic: "Финальный проект",                discipline: "МДК.01.01", date: d(7, 11),  status: "locked" },
  { id: "sl9",  type: "lecture",  topic: "Виды тестирования ПО",            discipline: "МДК.01.02", date: d(-16, 9), status: "done", score: 70, teacher: T_PETROV,  attendance: "present",   events: [{ type: "Занятие", controls: [{ form: "Тест", score: 70, maxScore: 100 }] }] },
  { id: "sl10", type: "practice", topic: "Unit-тестирование с pytest",      discipline: "МДК.01.02", date: d(-10, 11), status: "done", score: 85, teacher: T_PETROV, attendance: "present",   events: [{ type: "Занятие", controls: [{ form: "Практическая работа", score: 85, maxScore: 100 }] }] },
  { id: "sl11", type: "practice", topic: "Интеграционное тестирование",     discipline: "МДК.01.02", date: d(-4, 11), status: "done", score: 60, teacher: T_PETROV,  attendance: "present",   events: [{ type: "Занятие", controls: [{ form: "Практическая работа", score: 60, maxScore: 100 }] }] },
  { id: "sl12", type: "practice", topic: "Тестирование REST API",           discipline: "МДК.01.02", date: d(2, 11),  status: "available", teacher: T_PETROV, events: [{ type: "Занятие", controls: [{ form: "Практическая работа", maxScore: 100 }] }] },
  { id: "sl13", type: "lecture",  topic: "Нагрузочное тестирование",        discipline: "МДК.01.02", date: d(6, 9),   status: "locked" },
  { id: "sl14", type: "practice", topic: "Автоматизация тестирования",      discipline: "МДК.01.02", date: d(10, 11), status: "locked" },
];

const DEPT_PCT = "ПЦК информационных технологий";

const MOCK_SPO_PMS: MockPM[] = [
  {
    id: "pm1",
    code: "ПМ.01",
    title: "Разработка программного обеспечения",
    department: DEPT_PCT,
    mdks: [
      {
        id: "mdk0101", code: "МДК.01.01",
        title: "Разработка ПО на языках высокого уровня",
        department: DEPT_PCT,
        lessonCounts: { lec: 4, prac: 6, lab: 4 },
        brs: { current: 55, max: 100 },
        brsBreakdown: [
          { label: "Текущий контроль",  earned: 25, max: 40 },
          { label: "Рубежный контроль", earned: 30, max: 50 },
          { label: "Итоговый контроль", earned: null, max: 10, note: "Диф. зачёт · 15 апр 2026" },
        ],
        finalControl: { type: "Дифференцированный зачёт", date: "15 апр 2026", confirmed: true },
        totalLessons: 8, doneLessons: 5,
        lessons: MOCK_SPO_LESSONS.filter(l => l.discipline === "МДК.01.01"),
      },
      {
        id: "mdk0102", code: "МДК.01.02",
        title: "Тестирование программных модулей",
        department: DEPT_PCT,
        lessonCounts: { lec: 2, prac: 4 },
        brs: { current: 38, max: 100 },
        brsBreakdown: [
          { label: "Текущий контроль",  earned: 18, max: 40 },
          { label: "Рубежный контроль", earned: 20, max: 50 },
          { label: "Итоговый контроль", earned: null, max: 10, note: "Зачёт с оценкой · 22 мая 2026" },
        ],
        finalControl: { type: "Зачёт с оценкой", date: "22 мая 2026", confirmed: false },
        totalLessons: 6, doneLessons: 3,
        lessons: MOCK_SPO_LESSONS.filter(l => l.discipline === "МДК.01.02"),
      },
    ],
    practices: [
      {
        id: "up01", code: "УП.01", title: "Учебная практика",
        department: DEPT_PCT,
        totalDays: 12, doneDays: 4,
        finalControl: { type: "Дифференцированный зачёт", date: "5 июн 2026", confirmed: false },
      },
    ],
    finalControl: { type: "Экзамен квалификационный", date: "14 июн 2026", confirmed: false },
  },
  {
    id: "pm2",
    code: "ПМ.02",
    title: "Сопровождение и обслуживание ПО",
    department: DEPT_PCT,
    mdks: [
      {
        id: "mdk0201", code: "МДК.02.01",
        title: "Инструментальные средства разработки ПО",
        department: DEPT_PCT,
        lessonCounts: { lec: 2, prac: 4 },
        brs: { current: 0, max: 100 },
        finalControl: { type: "Дифференцированный зачёт", date: "10 янв 2027", confirmed: false },
        totalLessons: 6, doneLessons: 0,
        lessons: [],
      },
    ],
    practices: [
      {
        id: "pp01", code: "ПП.01", title: "Производственная практика",
        department: DEPT_PCT,
        totalDays: 24, doneDays: 0,
        finalControl: { type: "Дифференцированный зачёт", date: "18 янв 2027", confirmed: false },
      },
    ],
    finalControl: { type: "Экзамен квалификационный", date: "18 янв 2027", confirmed: false },
  },
];

// Быстрый поиск MDK и практики по id (для роутинга)
function findMDK(id: string): MockMDK | null {
  for (const pm of MOCK_SPO_PMS)
    for (const mdk of pm.mdks)
      if (mdk.id === id) return mdk;
  return null;
}
function findPractice(id: string): MockPractice | null {
  for (const pm of MOCK_SPO_PMS)
    for (const p of pm.practices)
      if (p.id === id) return p;
  return null;
}
function findPM(id: string): MockPM | null {
  return MOCK_SPO_PMS.find(p => p.id === id) ?? null;
}

// Мок зачётки — все дисциплины за все курсы (включая прошедшие)
interface GradebookEntry {
  id: string;
  title: string;
  course: number;
  semester: number;
  hours: number;
  grade?: string;
  gradeValue?: number;
  type: "exam" | "test" | "coursework";
  brs?: number;
}

const MOCK_GRADEBOOK: GradebookEntry[] = [
  // Курс 1
  { id: "g1",  course: 1, semester: 1, title: "Математика (ч. 1)",             hours: 108, type: "exam",       grade: "5",        gradeValue: 5 },
  { id: "g2",  course: 1, semester: 1, title: "Введение в программирование",   hours: 72,  type: "exam",       grade: "4",        gradeValue: 4 },
  { id: "g3",  course: 1, semester: 1, title: "Дискретная математика",         hours: 54,  type: "test",       grade: "Зачтено",  gradeValue: 5 },
  { id: "g4",  course: 1, semester: 2, title: "Математика (ч. 2)",             hours: 108, type: "exam",       grade: "4",        gradeValue: 4 },
  { id: "g5",  course: 1, semester: 2, title: "Алгоритмы и структуры данных",  hours: 90,  type: "exam",       grade: "5",        gradeValue: 5 },
  { id: "g6",  course: 1, semester: 2, title: "Физическая культура",           hours: 72,  type: "test",       grade: "Зачтено",  gradeValue: 5 },
  // Курс 2
  { id: "g7",  course: 2, semester: 3, title: "ООП и паттерны проектирования", hours: 90,  type: "exam",       grade: "5",        gradeValue: 5 },
  { id: "g8",  course: 2, semester: 3, title: "Операционные системы",          hours: 72,  type: "exam",       grade: "4",        gradeValue: 4 },
  { id: "g9",  course: 2, semester: 3, title: "Теория вероятностей",           hours: 72,  type: "test",       grade: "Зачтено",  gradeValue: 5 },
  { id: "g10", course: 2, semester: 4, title: "Компьютерные сети",             hours: 90,  type: "exam",       grade: "3",        gradeValue: 3 },
  { id: "g11", course: 2, semester: 4, title: "Базы данных (основы)",          hours: 72,  type: "exam",       grade: "5",        gradeValue: 5 },
  { id: "g12", course: 2, semester: 4, title: "Курсовая работа",               hours: 36,  type: "coursework", grade: "5",        gradeValue: 5 },
  // Курс 3
  { id: "g13", course: 3, semester: 5, title: "Архитектура ПО",                hours: 90,  type: "exam",       grade: "4",        gradeValue: 4 },
  { id: "g14", course: 3, semester: 5, title: "Веб-технологии",                hours: 72,  type: "exam",       grade: "5",        gradeValue: 5 },
  { id: "g15", course: 3, semester: 6, title: "Безопасность ИС",               hours: 72,  type: "exam",       grade: "4",        gradeValue: 4 },
  { id: "g16", course: 3, semester: 6, title: "Курсовой проект",               hours: 36,  type: "coursework", grade: "5",        gradeValue: 5 },
  // Курс 4 — текущий (оценки не выставлены)
  { id: "g17", course: 4, semester: 7, title: "Базы данных",                   hours: 108, type: "exam", brs: 42 },
  { id: "g18", course: 4, semester: 7, title: "Математический анализ",         hours: 72,  type: "exam", brs: 28 },
  { id: "g19", course: 4, semester: 8, title: "Правовое регулирование в ИТ",   hours: 54,  type: "test", brs: 61 },
];

// ── Контексты обучающегося ────────────────────────────────────────────────────
type ContextStatus = "active" | "completed";
type ContextType   = "specialty" | "dpo" | "course";

interface LearnerContext {
  id: string;
  name: string;
  type: ContextType;
  period: string;
  status: ContextStatus;
  completedAt?: string;
  periodsPerYear: number; // 2 = семестры, 3 = триместры
  program?: "spo";        // если задано — показывать ПМ вместо дисциплин
}

const MOCK_CONTEXTS: LearnerContext[] = [
  { id: "c1",  name: "Информационные технологии",    type: "specialty", period: "IV курс · Весенний семестр 2026", status: "active",    periodsPerYear: 2 },
  { id: "c2",  name: "Маркетинг и реклама",          type: "specialty", period: "I курс · Осенний семестр 2026",   status: "active",    periodsPerYear: 2 },
  { id: "c3",  name: "Python для анализа данных",    type: "dpo",       period: "Курс ДПО · 72 часа",              status: "active",    periodsPerYear: 3 },
  { id: "c4",  name: "Основы проектного управления", type: "dpo",       period: "Курс ДПО · 36 часов",             status: "completed", periodsPerYear: 2, completedAt: "2025" },
  { id: "spo", name: "Разработка ПО и ВТ",          type: "specialty", period: "СПО · 3 семестр 2025–2026",       status: "active",    periodsPerYear: 2, program: "spo" },
];

interface CompletedDiscipline {
  id: string;
  title: string;
  totalLessons: number;
  grade?: string; // итоговая оценка
  status: "passed" | "failed" | "pending";
}

const MOCK_COMPLETED_DISCIPLINES: Record<string, CompletedDiscipline[]> = {
  c4: [
    { id: "cd1", title: "Основы управления проектами",    totalLessons: 6,  grade: "Отлично",  status: "passed" },
    { id: "cd2", title: "Agile и Scrum на практике",      totalLessons: 8,  grade: "Хорошо",   status: "passed" },
    { id: "cd3", title: "Управление рисками",             totalLessons: 4,  grade: "Отлично",  status: "passed" },
    { id: "cd4", title: "Итоговая аттестация",            totalLessons: 1,  grade: "Зачтено",  status: "passed" },
  ],
};

const CONTEXT_TYPE_LABEL: Record<ContextType, string> = {
  specialty: "Специальность",
  dpo:       "ДПО",
  course:    "Курс",
};

const DEFAULT_CTX_KEY = "eios_default_context";

function getDefaultContextId(): string {
  return localStorage.getItem(DEFAULT_CTX_KEY) ?? MOCK_CONTEXTS.find(c => c.status === "active")?.id ?? MOCK_CONTEXTS[0].id;
}

// ── Мок-уведомления ───────────────────────────────────────────────────────────
interface NotifLink { label: string; url: string; }
interface Notification {
  id: string;
  type: "univerkon" | "system";
  title: string;
  body: string;           // краткое, всегда показывается в списке
  fullText?: string;      // если есть → карточка кликабельна и открывает детальный экран
  links?: NotifLink[];    // ссылки на детальном экране
  date: Date;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1", type: "univerkon", read: false, date: d(0, 8),
    title: "Новое занятие доступно",
    body: "Открылось занятие «Транзакции и блокировки» по дисциплине Базы данных",
    fullText: "Уважаемый обучающийся!\n\nВам открыт доступ к занятию «Транзакции и блокировки» в рамках дисциплины «Базы данных».\n\nЗанятие содержит теоретический материал и практическое задание. Срок выполнения — до 5 июля 2026 г. По итогам занятия будет выставлена оценка в ведомости.",
    links: [
      { label: "Перейти к занятию", url: "#/lesson/l6" },
      { label: "Учебный план", url: "#/disciplines" },
    ],
  },
  {
    id: "n2", type: "univerkon", read: false, date: d(-1, 14),
    title: "Оценка выставлена",
    body: "По дисциплине «Математический анализ» выставлена оценка за тему «Производные»",
    fullText: "По результатам проверки работы по теме «Производные и их применение» преподавателем выставлена оценка: 4 (хорошо).\n\nНабрано баллов: 55 из 100. Работа зачтена.",
    links: [
      { label: "Посмотреть оценку", url: "#/disciplines/d2" },
    ],
  },
  {
    id: "n3", type: "system", read: true, date: d(-2, 10),
    title: "Плановые работы",
    body: "26 июня с 23:00 до 01:00 технические работы — ЭИОС будет недоступна",
  },
  {
    id: "n4", type: "system", read: true, date: d(-5, 9),
    title: "Обновление системы",
    body: "ЭИОС обновлена до версии 0.2.0. Исправлены ошибки и улучшена скорость загрузки.",
    fullText: "В версии 0.2.0:\n• Улучшена скорость загрузки расписания\n• Исправлено отображение оценок при слабом интернете\n• Добавлена тёмная/светлая тема\n• Уведомления теперь содержат подробный текст и ссылки",
  },
];

// ── Вспомогательные функции ───────────────────────────────────────────────────
const LESSON_TYPE_LABEL: Record<LessonType, string> = { lecture: "Лек", practice: "Пр", lab: "Лаб" };
const LESSON_TYPE_COLOR: Record<LessonType, string> = { lecture: "#4B9EE5", practice: "#7C5CBF", lab: "#2EA05A" };

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

function formatDay(d: Date) {
  return d.toLocaleDateString("ru", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export function Trajectory({ studentId: _studentId, onLogout, lkUrl }: { studentId: StudentId; onLogout?: () => void; lkUrl?: string }) {
  const route = useRoute();
  const { locale, changeLocale, t } = useLocale();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getThemeMode);
  const [scheduleView, setScheduleView] = useState<"day" | "week">("day");
  const [selectedDay, setSelectedDay] = useState(TODAY);
  const [currentContextId, setCurrentContextId] = useState(getDefaultContextId);
  const [defaultContextId, setDefaultContextId] = useState(getDefaultContextId);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [swUpdate, setSwUpdate] = useState(false);

  useEffect(() => { onSwUpdate((s) => setSwUpdate(s === "available")); }, []);

  function handleThemeChange(mode: ThemeMode) {
    setTheme(mode);
    setThemeMode(mode);
  }

  const currentCtx = MOCK_CONTEXTS.find(c => c.id === currentContextId) ?? MOCK_CONTEXTS[0];

  // Когда активен завершённый контекст и URL не на profiles/completed — редиректим
  useEffect(() => {
    if (currentCtx.status === "completed" && route.name !== "profiles" && route.name !== "completed") {
      navigate({ name: "completed", contextId: currentCtx.id });
    }
  }, [currentCtx.id, currentCtx.status, route.name]);

  function switchContext(id: string) {
    setCurrentContextId(id);
    const ctx = MOCK_CONTEXTS.find(c => c.id === id);
    if (ctx?.status === "completed") navigate({ name: "completed", contextId: id });
    else navigate({ name: "schedule" });
  }
  function setDefault(id: string) {
    localStorage.setItem(DEFAULT_CTX_KEY, id);
    setDefaultContextId(id);
  }
  function markRead(id: string) {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  }
  function markAllRead() {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const tab = route.name === "disciplines" ? "disciplines"
            : route.name === "gradebook"   ? "gradebook"
            : route.name === "profile"     ? "profile"
            : "schedule";

  const allLessons       = currentCtx.program === "spo" ? MOCK_SPO_LESSONS : MOCK_LESSONS;
  const lesson           = route.name === "lesson"       ? allLessons.find(l => l.id === route.id) ?? null : null;
  const openDisciplineId = route.name === "discipline"   ? route.id : null;
  const discipline       = openDisciplineId ? MOCK_DISCIPLINES.find(d => d.id === openDisciplineId) ?? null : null;
  const openMDK          = route.name === "discipline"   ? findMDK(route.id) : null;
  const openPM           = route.name === "pm"           ? findPM(route.id) : null;
  const openPractice     = route.name === "practice"     ? findPractice(route.id) : null;
  const openNotification = route.name === "notification" ? notifications.find(n => n.id === route.id) ?? null : null;

  let inner: React.ReactNode;
  if (lesson) {
    inner = <LessonScreen lesson={lesson} onBack={() => history.back()} />;
  } else if (route.name === "completed") {
    const completedCtx = MOCK_CONTEXTS.find(c => c.id === route.contextId) ?? currentCtx;
    inner = <CompletedContextScreen context={completedCtx} onSwitchContext={() => navigate({ name: "profiles" })} />;
  } else if (route.name === "profiles") {
    inner = (
      <>
        <Header
          context={currentCtx}
          unreadCount={unreadCount}
          onContextTap={() => history.back()}
          onBell={() => navigate({ name: "notifications" })}
          onLogout={onLogout ? () => setShowLogoutConfirm(true) : undefined}
          contextLabel={t("learnerProfile")}
          t={t}
        />
        {showLogoutConfirm && (
          <ConfirmModal
            title="Выйти из ЭИОС?"
            message="Сессия будет завершена на этом устройстве."
            confirmLabel="Выйти"
            onConfirm={() => { setShowLogoutConfirm(false); onLogout?.(); }}
            onCancel={() => setShowLogoutConfirm(false)}
            danger
          />
        )}
        <ContextSwitcherScreen
          contexts={MOCK_CONTEXTS}
          currentId={currentContextId}
          defaultId={defaultContextId}
          onSelect={switchContext}
          onSetDefault={setDefault}
        />
      </>
    );
  } else if (openNotification) {
    inner = <NotificationDetailScreen notification={openNotification} onBack={() => history.back()} />;
  } else if (route.name === "notifications") {
    inner = (
      <NotificationsScreen
        notifications={notifications}
        onBack={() => history.back()}
        onOpen={(n) => { markRead(n.id); navigate({ name: "notification", id: n.id }); }}
        onRead={markRead}
        onReadAll={markAllRead}
      />
    );
  } else if (openPM) {
    inner = (
      <PMScreen
        pm={openPM}
        onBack={() => history.back()}
        onMDK={(id) => navigate({ name: "discipline", id })}
        onPractice={(id) => navigate({ name: "practice", id })}
        onLesson={(l) => navigate({ name: "lesson", id: l.id })}
      />
    );
  } else if (openPractice) {
    inner = <PracticeScreen practice={openPractice} onBack={() => history.back()} />;
  } else if (discipline) {
    inner = (
      <DisciplineScreen
        discipline={discipline}
        onBack={() => history.back()}
        onLesson={(l) => navigate({ name: "lesson", id: l.id })}
      />
    );
  } else if (openMDK) {
    inner = (
      <DisciplineScreen
        discipline={{
          id: openMDK.id, title: `${openMDK.code} · ${openMDK.title}`,
          totalLessons: openMDK.totalLessons, doneLessons: openMDK.doneLessons,
          lessons: openMDK.lessons, course: 3, semester: 5,
          department: openMDK.department,
          lessonCounts: openMDK.lessonCounts,
          brs: openMDK.brs,
          brsBreakdown: openMDK.brsBreakdown,
          finalControl: openMDK.finalControl,
        }}
        onBack={() => history.back()}
        onLesson={(l) => navigate({ name: "lesson", id: l.id })}
      />
    );
  } else {
    inner = (
      <>
        <Header
          context={currentCtx}
          unreadCount={unreadCount}
          onContextTap={() => navigate({ name: "profiles" })}
          onBell={() => navigate({ name: "notifications" })}
          onLogout={onLogout ? () => setShowLogoutConfirm(true) : undefined}
          t={t}
        />
        {showLogoutConfirm && (
          <ConfirmModal
            title={t("logout") + "?"}
            message="Сессия будет завершена на этом устройстве."
            confirmLabel={t("logout")}
            onConfirm={() => { setShowLogoutConfirm(false); onLogout?.(); }}
            onCancel={() => setShowLogoutConfirm(false)}
            danger
          />
        )}
        <div style={s.body}>
          {tab === "schedule" && (
            <ScheduleTab
              view={scheduleView}
              onViewChange={setScheduleView}
              selectedDay={selectedDay}
              onDayChange={setSelectedDay}
              onLesson={(l) => navigate({ name: "lesson", id: l.id })}
              lessons={allLessons}
              t={t}
            />
          )}
          {tab === "disciplines" && (
            <DisciplinesTab
              periodsPerYear={currentCtx.periodsPerYear}
              pms={currentCtx.program === "spo" ? MOCK_SPO_PMS : undefined}
              onDiscipline={(id) => navigate({ name: "discipline", id })}
              onPM={(id) => navigate({ name: "pm", id })}
              onLesson={(l) => navigate({ name: "lesson", id: l.id })}
              t={t}
            />
          )}
          {tab === "gradebook" && (
            <GradebookTab
              periodsPerYear={currentCtx.periodsPerYear}
              pms={currentCtx.program === "spo" ? MOCK_SPO_PMS : undefined}
              t={t}
            />
          )}
          {tab === "profile" && (
            <ProfileTab
              locale={locale}
              onChangeLocale={changeLocale}
              themeMode={themeMode}
              onThemeChange={handleThemeChange}
              eiv={MOCK_EIV}
              student={MOCK_STUDENT}
              lkUrl={lkUrl}
              onLogout={onLogout ? () => setShowLogoutConfirm(true) : undefined}
              t={t}
            />
          )}
        </div>
        <BottomNav tab={tab} onChange={(v: string) => navigate({ name: v as "schedule" | "disciplines" | "profile" })} t={t} />
      </>
    );
  }

  return (
    <div style={s.root}>
      {inner}
      <StatusBar swUpdate={swUpdate} eiv={MOCK_EIV} t={t} />
    </div>
  );
}

// ── Шапка ─────────────────────────────────────────────────────────────────────
function Header({ context, unreadCount, onContextTap, onBell, onLogout, contextLabel, t }: {
  context: LearnerContext;
  unreadCount: number;
  onContextTap: () => void;
  onBell: () => void;
  onLogout?: () => void;
  contextLabel?: string;
  t: (k: StringKey) => string;
}) {
  return (
    <header style={s.header}>
      <div style={s.headerLogo}>
        <LogoIcon />
        <span style={s.headerTitle}>ЭИОС</span>
      </div>
      {contextLabel
        ? <div style={{ ...s.contextBtn as React.CSSProperties, cursor: "default" }}>
            <div style={{ ...s.contextName, fontSize: "0.78rem", fontWeight: 600 }}>{contextLabel}</div>
          </div>
        : <button style={s.contextBtn} onClick={onContextTap}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5, minWidth: 0 }}>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <div style={s.contextName}>{context.name}</div>
                <div style={s.contextPeriod}>{context.period}</div>
              </div>
              <span style={s.contextChevron}><SwitchIcon /></span>
            </div>
          </button>
      }
      <button style={s.bellBtn} onClick={onBell}>
        <BellIcon />
        {unreadCount > 0 && <span style={s.bellBadge}>{unreadCount}</span>}
      </button>
      <div style={s.avatar}>АМ</div>
      {onLogout && (
        <button style={s.logoutBtn} onClick={onLogout} title={t("logout")}>
          <LogoutIcon />
        </button>
      )}
    </header>
  );
}

// ── Статусная строка ──────────────────────────────────────────────────────────
function StatusBar({ swUpdate, eiv, t }: { swUpdate: boolean; eiv?: string; t: (k: StringKey) => string }) {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0";
  const commit  = typeof __COMMIT_HASH__  !== "undefined" ? __COMMIT_HASH__  : "";
  const [copied, setCopied] = useState(false);

  function copySupportInfo() {
    const screen = window.location.hash || "#/";
    const parts = [`ЭИОС v${version}`, commit, eiv ? `ЕИВ ${eiv}` : null, screen].filter(Boolean);
    navigator.clipboard.writeText(parts.join(" · ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={s.statusBar}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {swUpdate && <button style={s.updateBtn} onClick={applySwUpdate}>{t("update")}</button>}
      </div>
      <button style={s.versionBtn} onClick={copySupportInfo} title="Скопировать для поддержки">
        {copied
          ? <span style={{ color: "var(--c-success)" }}>✓ {t("copied")}</span>
          : <span style={s.versionLabel}>v{version}{commit ? ` · ${commit}` : ""}</span>
        }
      </button>
    </div>
  );
}

// ── Нижняя навигация ──────────────────────────────────────────────────────────
function BottomNav({ tab, onChange, t }: { tab: string; onChange: (v: string) => void; t: (k: StringKey) => string }) {
  const items = [
    { id: "schedule",    label: t("schedule"),    icon: <CalIcon /> },
    { id: "disciplines", label: t("disciplines"), icon: <BookIcon /> },
    { id: "gradebook",   label: t("gradebook"),   icon: <GradebookIcon /> },
    { id: "profile",     label: t("profile"),     icon: <PersonIcon /> },
  ];
  return (
    <nav style={s.bottomNav}>
      {items.map(it => (
        <button key={it.id} style={s.navItem} onClick={() => onChange(it.id)}>
          <span style={{ color: tab === it.id ? "var(--c-accent)" : "var(--c-text-dim)" }}>{it.icon}</span>
          <span style={{ ...s.navLabel, color: tab === it.id ? "var(--c-accent)" : "var(--c-text-dim)" }}>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── Расписание ────────────────────────────────────────────────────────────────
function ScheduleTab({ view, onViewChange, selectedDay, onDayChange, onLesson, lessons: lessonsProp, t }: {
  view: "day" | "week";
  onViewChange: (v: "day" | "week") => void;
  selectedDay: Date;
  onDayChange: (d: Date) => void;
  onLesson: (l: MockLesson) => void;
  lessons?: MockLesson[];
  t: (k: StringKey) => string;
}) {
  const LESSONS = lessonsProp ?? MOCK_LESSONS;
  // Генерируем 14 дней от сегодня - 7 до сегодня + 7
  const days: Date[] = Array.from({ length: 14 }, (_, i) => {
    const dt = new Date(TODAY);
    dt.setDate(TODAY.getDate() - 3 + i);
    return dt;
  });

  const weekStart = startOfWeek(selectedDay);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(weekStart);
    dt.setDate(weekStart.getDate() + i);
    return dt;
  });

  const visibleLessons = view === "day"
    ? LESSONS.filter(l => sameDay(l.date, selectedDay)).sort((a, b) => a.date.getTime() - b.date.getTime())
    : LESSONS.filter(l => weekDays.some(wd => sameDay(l.date, wd))).sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div>
      {/* Тоггл день/неделя */}
      <div style={s.toggle}>
        <button style={{ ...s.toggleBtn, ...(view === "day" ? s.toggleActive : {}) }} onClick={() => onViewChange("day")}>{t("day")}</button>
        <button style={{ ...s.toggleBtn, ...(view === "week" ? s.toggleActive : {}) }} onClick={() => onViewChange("week")}>{t("week")}</button>
      </div>

      {/* Горизонтальная полоса дней */}
      <div style={s.dayStrip}>
        {days.map(day => {
          const hasLessons = LESSONS.some(l => sameDay(l.date, day));
          const isSelected = sameDay(day, selectedDay);
          const isToday = sameDay(day, TODAY);
          return (
            <button key={day.toISOString()} style={s.dayBtn} onClick={() => { onDayChange(day); onViewChange("day"); }}>
              <span style={{ ...s.dayBtnWd, color: isSelected ? "var(--c-accent)" : isToday ? "var(--c-text-primary)" : "var(--c-text-muted)" }}>
                {day.toLocaleDateString("ru", { weekday: "short" })}
              </span>
              <span style={{
                ...s.dayBtnNum,
                background: isSelected ? "var(--c-accent)" : "transparent",
                color: isSelected ? "#fff" : isToday ? "#fff" : "var(--c-text-secondary)",
              }}>
                {day.getDate()}
              </span>
              {hasLessons && <span style={{ ...s.dayDot, background: isSelected ? "#fff" : "var(--c-accent)" }} />}
            </button>
          );
        })}
      </div>

      {/* Заголовок */}
      <div style={s.sectionLabel}>
        {view === "day"
          ? sameDay(selectedDay, TODAY) ? t("today") : formatDay(selectedDay)
          : `${formatDay(weekDays[0])} — ${formatDay(weekDays[6])}`
        }
      </div>

      {/* Карточки занятий */}
      {visibleLessons.length === 0
        ? <div style={s.empty}>{t("noLessons")}</div>
        : visibleLessons.map(l => (
          <LessonCard key={l.id} lesson={l} showDate={view === "week"} onOpen={() => onLesson(l)} />
        ))
      }
    </div>
  );
}

// ── Карточка занятия ──────────────────────────────────────────────────────────
function LessonCard({ lesson: l, showDate, onOpen }: { lesson: MockLesson; showDate: boolean; onOpen: () => void }) {
  const typeColor = LESSON_TYPE_COLOR[l.type];
  const isLocked = l.status === "locked";

  return (
    <div style={{ ...s.lessonCard, opacity: isLocked ? 0.55 : 1 }} onClick={isLocked ? undefined : onOpen}>
      <div style={{ ...s.lessonTypeTag, background: hexToRgba(typeColor, 0.15), color: typeColor }}>
        {LESSON_TYPE_LABEL[l.type]}
      </div>
      <div style={s.lessonBody}>
        {showDate && <div style={s.lessonDate}>{formatDay(l.date)} · {formatTime(l.date)}</div>}
        <div style={s.lessonDiscipline}>{l.discipline}</div>
        <div style={{ ...s.lessonTopic, color: isLocked ? "var(--c-text-muted)" : "var(--c-text-primary)" }}>{l.topic}</div>
        {l.score !== undefined && <div style={s.lessonScore}>{l.score}% · пройдено</div>}
        {l.status === "locked" && <div style={s.lessonLocked}>Ещё не доступно</div>}
      </div>
      {!isLocked && (
        <div style={s.lessonChevron}>›</div>
      )}
      {l.status === "done" && <div style={s.lessonDoneDot} />}
    </div>
  );
}

// ── Переключатель курсов ──────────────────────────────────────────────────────
function CourseTabBar({ courses, selected, onSelect, t }: {
  courses: number[];
  selected: number;
  onSelect: (c: number) => void;
  t: (k: StringKey) => string;
}) {
  return (
    <div style={s.courseTabBar}>
      {courses.map(c => (
        <button
          key={c}
          style={c === selected ? { ...s.courseTab, ...s.courseTabActive } : s.courseTab}
          onClick={() => onSelect(c)}
        >
          {t("course")} {c}
        </button>
      ))}
    </div>
  );
}

// ── Дисциплины ────────────────────────────────────────────────────────────────
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

function fcChipStyle(type: string): React.CSSProperties {
  if (type === "Экзамен" || type.includes("квалификационный"))
    return { background: "color-mix(in srgb, #7C5CBF 18%, transparent)", color: "#a97de8" };
  if (type.startsWith("Зачёт с оценкой") || type.startsWith("Дифференцированный"))
    return { background: "color-mix(in srgb, var(--c-accent) 15%, transparent)", color: "var(--c-accent)" };
  return { background: "color-mix(in srgb, var(--c-success) 15%, transparent)", color: "var(--c-success)" };
}

function DisciplineCardContent({ d }: { d: MockDiscipline }) {
  const pct = d.totalLessons > 0 ? Math.round((d.doneLessons / d.totalLessons) * 100) : 0;
  return (
    <>
      <div style={{ ...s.disciplineHead, marginBottom: d.department ? 2 : 8 }}>
        <span style={s.disciplineTitle}>{d.title}</span>
        {d.grade
          ? <span style={{ ...s.gradeChip, background: "var(--c-success-bg)", color: "var(--c-success)" }}>{d.grade}</span>
          : d.brs
            ? <span style={s.brsBadge}>{d.brs.current}<span style={s.brsMax}> / 100 б.</span></span>
            : null
        }
      </div>
      {d.department && <div style={s.disciplineDept}>{d.department}</div>}
      <div style={{ ...s.disciplineBar, margin: "8px 0 10px" }}>
        <div style={{ ...s.disciplineFill, width: `${pct}%` }} />
      </div>
      <div style={s.disciplineFooter}>
        {d.lessonCounts && (
          <div style={s.lcRow}>
            {[
              d.lessonCounts.lec  != null ? `${d.lessonCounts.lec} Лек`  : null,
              d.lessonCounts.prac != null ? `${d.lessonCounts.prac} Пр`  : null,
              d.lessonCounts.lab  != null ? `${d.lessonCounts.lab} Лаб`  : null,
            ].filter((x): x is string => x !== null).join(" · ")}
          </div>
        )}
        {d.finalControl && <FinalControlChip fc={d.finalControl} />}
      </div>
    </>
  );
}

function FinalControlChip({ fc }: { fc: { type: string; date: string; confirmed: boolean } }) {
  return (
    <div style={s.fcWrap}>
      <span style={{ ...s.fcChip, ...fcChipStyle(fc.type) }}>{fc.type}</span>
      <div style={fc.confirmed ? s.fcDate : s.fcDatePlan}>
        {!fc.confirmed && <span style={s.fcPlanDot} />}
        {!fc.confirmed && "~ "}{fc.date}
      </div>
      {!fc.confirmed && <div style={s.fcPlanLabel}>планируется</div>}
    </div>
  );
}

function PMCard({ pm, onClick }: { pm: MockPM; onClick: () => void }) {
  const totalL = pm.mdks.reduce((s, m) => s + m.totalLessons, 0);
  const doneL  = pm.mdks.reduce((s, m) => s + m.doneLessons, 0);
  const pct    = totalL > 0 ? Math.round((doneL / totalL) * 100) : 0;
  const comp   = [
    pm.mdks.length > 0 ? `${pm.mdks.length} МДК` : null,
    pm.practices.filter(p => p.code.startsWith("УП")).length > 0 ? "УП" : null,
    pm.practices.filter(p => p.code.startsWith("ПП")).length > 0 ? "ПП" : null,
  ].filter(Boolean).join(" · ");

  return (
    <button style={s.pmCard} onClick={onClick}>
      <div style={s.pmHead}>
        <div style={{ minWidth: 0 }}>
          <div style={s.pmCode}>{pm.code}</div>
          <div style={s.pmTitle}>{pm.title}</div>
        </div>
        <span style={s.pmFolderIcon}>▸</span>
      </div>
      {pm.department && <div style={s.disciplineDept}>{pm.department}</div>}
      <div style={s.pmComposition}>{comp}</div>
      <div style={{ ...s.disciplineBar, margin: "8px 0 10px" }}>
        <div style={{ ...s.disciplineFill, width: `${pct}%` }} />
      </div>
      <div style={{ ...s.disciplineFooter, justifyContent: "flex-end" }}>
        {pm.finalControl && <FinalControlChip fc={pm.finalControl} />}
      </div>
    </button>
  );
}

function DisciplinesTab({ periodsPerYear, pms, onDiscipline, onPM, onLesson: _onLesson, t }: {
  periodsPerYear: number;
  pms?: MockPM[];
  onDiscipline: (id: string) => void;
  onPM: (id: string) => void;
  onLesson: (l: MockLesson) => void;
  t: (k: StringKey) => string;
}) {
  // СПО-режим: показываем ПМ
  if (pms) {
    return (
      <div>
        {pms.map(pm => <PMCard key={pm.id} pm={pm} onClick={() => onPM(pm.id)} />)}
      </div>
    );
  }

  // ВУЗ-режим: дисциплины по курсам/семестрам
  type Group = Record<number, Record<number, MockDiscipline[]>>;
  const byCourse = MOCK_DISCIPLINES.reduce<Group>((acc, d) => {
    if (!acc[d.course]) acc[d.course] = {};
    if (!acc[d.course][d.semester]) acc[d.course][d.semester] = [];
    acc[d.course][d.semester].push(d);
    return acc;
  }, {});
  const courses = Object.keys(byCourse).map(Number).sort((a, b) => a - b);
  const [selectedCourse, setSelectedCourse] = useState(() => Math.max(...courses));

  function semLabel(course: number, semester: number): string {
    const withinCourse = ((semester - 1) % periodsPerYear) + 1;
    const roman = ROMAN[withinCourse - 1] ?? String(withinCourse);
    return `${t("semester")} ${semester} (${roman})`;
  }

  return (
    <div>
      <CourseTabBar courses={courses} selected={selectedCourse} onSelect={setSelectedCourse} t={t} />
      {byCourse[selectedCourse] && Object.keys(byCourse[selectedCourse]).map(Number).sort((a, b) => a - b).map(sem => (
        <div key={sem}>
          <div style={s.sectionLabel}>{semLabel(selectedCourse, sem)}</div>
          {byCourse[selectedCourse][sem].map(d => (
            <button key={d.id} style={s.disciplineCard} onClick={() => onDiscipline(d.id)}>
              <DisciplineCardContent d={d} />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── БРС-детализация ───────────────────────────────────────────────────────────
function BRSBreakdownBlock({ brs, items }: { brs?: { current: number; max: number }; items: BRSItem[] }) {
  const totalPct = brs ? Math.round((brs.current / brs.max) * 100) : 0;
  return (
    <div style={s.brsBlock}>
      {brs && (
        <div style={s.brsTotalRow}>
          <span style={s.brsTotalLabel}>БРС</span>
          <div style={{ ...s.disciplineBar, flex: 1 }}>
            <div style={{ ...s.disciplineFill, width: `${totalPct}%` }} />
          </div>
          <span style={s.brsTotalScore}>
            {brs.current} <span style={s.brsMax}>/ {brs.max} б.</span>
          </span>
        </div>
      )}
      <div style={s.brsGrid}>
        {items.map((item, i) => {
          const pct = item.earned !== null ? Math.round((item.earned / item.max) * 100) : 0;
          const isEmpty = item.earned === null;
          return (
            <div key={i} style={s.brsGridItem}>
              <div style={s.brsItemRow}>
                <span style={{ ...s.brsItemLabel, color: isEmpty ? "var(--c-text-dim)" : "var(--c-text-secondary)" }}>
                  {item.label}
                </span>
                <span style={s.brsItemScore}>
                  {isEmpty
                    ? <span style={{ color: "var(--c-text-dim)" }}>— / {item.max}</span>
                    : <><span style={{ color: "var(--c-accent)", fontWeight: 700 }}>{item.earned}</span><span style={{ color: "var(--c-text-muted)", fontSize: "0.7rem" }}> / {item.max}</span></>
                  }
                </span>
              </div>
              <div style={{ ...s.disciplineBar, marginTop: 5 }}>
                {!isEmpty && <div style={{ ...s.disciplineFill, width: `${pct}%` }} />}
              </div>
              {item.note && <div style={s.brsItemNote}>{item.note}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Экран дисциплины ──────────────────────────────────────────────────────────
function DisciplineScreen({ discipline, onBack, onLesson }: {
  discipline: MockDiscipline;
  onBack: () => void;
  onLesson: (l: MockLesson) => void;
}) {
  return (
    <>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> Назад
        </button>
        <div style={s.subHeaderTitle}>{discipline.title}</div>
      </div>
      <div style={{ ...s.body, paddingTop: 16 }}>
        {discipline.brsBreakdown && (
          <BRSBreakdownBlock brs={discipline.brs} items={discipline.brsBreakdown} />
        )}
        <div style={s.sectionLabel}>Все занятия</div>
        {discipline.lessons.map(l => (
          <LessonCard key={l.id} lesson={l} showDate={true} onOpen={() => onLesson(l)} />
        ))}
      </div>
    </>
  );
}

// ── Экран ПМ (список МДК + практик) ──────────────────────────────────────────
function MDKCard({ mdk, onClick }: { mdk: MockMDK; onClick: () => void }) {
  const pct = mdk.totalLessons > 0 ? Math.round((mdk.doneLessons / mdk.totalLessons) * 100) : 0;
  return (
    <button style={s.disciplineCard} onClick={onClick}>
      <div style={{ ...s.disciplineHead, marginBottom: mdk.department ? 2 : 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={s.mdkCode}>{mdk.code}</div>
          <span style={s.disciplineTitle}>{mdk.title}</span>
        </div>
        {mdk.brs
          ? <span style={s.brsBadge}>{mdk.brs.current}<span style={s.brsMax}> / 100 б.</span></span>
          : null
        }
      </div>
      {mdk.department && <div style={s.disciplineDept}>{mdk.department}</div>}
      <div style={{ ...s.disciplineBar, margin: "8px 0 10px" }}>
        <div style={{ ...s.disciplineFill, width: `${pct}%` }} />
      </div>
      <div style={s.disciplineFooter}>
        {mdk.lessonCounts && (
          <div style={s.lcRow}>
            {[
              mdk.lessonCounts.lec  != null ? `${mdk.lessonCounts.lec} Лек`  : null,
              mdk.lessonCounts.prac != null ? `${mdk.lessonCounts.prac} Пр`  : null,
              mdk.lessonCounts.lab  != null ? `${mdk.lessonCounts.lab} Лаб`  : null,
            ].filter((x): x is string => x !== null).join(" · ")}
          </div>
        )}
        {mdk.finalControl && <FinalControlChip fc={mdk.finalControl} />}
      </div>
    </button>
  );
}

function PracticeCard({ p, onClick }: { p: MockPractice; onClick: () => void }) {
  const pct = p.totalDays > 0 ? Math.round((p.doneDays / p.totalDays) * 100) : 0;
  return (
    <button style={s.disciplineCard} onClick={onClick}>
      <div style={{ ...s.disciplineHead, marginBottom: p.department ? 2 : 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={s.mdkCode}>{p.code}</div>
          <span style={s.disciplineTitle}>{p.title}</span>
        </div>
      </div>
      {p.department && <div style={s.disciplineDept}>{p.department}</div>}
      <div style={{ ...s.disciplineBar, margin: "8px 0 10px" }}>
        <div style={{ ...s.disciplineFill, width: `${pct}%` }} />
      </div>
      <div style={s.disciplineFooter}>
        <div style={s.lcRow}>{p.totalDays} дней практики</div>
        {p.finalControl && <FinalControlChip fc={p.finalControl} />}
      </div>
    </button>
  );
}

function PMScreen({ pm, onBack, onMDK, onPractice, onLesson: _onLesson }: {
  pm: MockPM;
  onBack: () => void;
  onMDK: (id: string) => void;
  onPractice: (id: string) => void;
  onLesson: (l: MockLesson) => void;
}) {
  return (
    <>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> Назад
        </button>
        <div style={s.subHeaderTitle}>{pm.code} · {pm.title}</div>
      </div>
      <div style={{ ...s.body, paddingTop: 16 }}>
        {pm.mdks.map(mdk => <MDKCard key={mdk.id} mdk={mdk} onClick={() => onMDK(mdk.id)} />)}
        {pm.practices.map(p => <PracticeCard key={p.id} p={p} onClick={() => onPractice(p.id)} />)}
      </div>
    </>
  );
}

// ── Экран практики ────────────────────────────────────────────────────────────
function PracticeScreen({ practice, onBack }: { practice: MockPractice; onBack: () => void }) {
  const pct = practice.totalDays > 0 ? Math.round((practice.doneDays / practice.totalDays) * 100) : 0;
  return (
    <>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> Назад
        </button>
        <div style={s.subHeaderTitle}>{practice.code} · {practice.title}</div>
      </div>
      <div style={{ ...s.body, paddingTop: 16 }}>
        {practice.department && (
          <div style={s.lsBlock}>
            <div style={s.lsBlockLabel}>Подразделение</div>
            <div style={{ color: "var(--c-text-secondary)", fontSize: "0.88rem" }}>{practice.department}</div>
          </div>
        )}
        <div style={s.lsBlock}>
          <div style={s.lsBlockLabel}>Прогресс</div>
          <div style={{ color: "var(--c-text-primary)", fontSize: "0.95rem", fontWeight: 600, marginBottom: 8 }}>
            {practice.doneDays} <span style={{ color: "var(--c-text-muted)", fontWeight: 400, fontSize: "0.8rem" }}>/ {practice.totalDays} дней</span>
          </div>
          <div style={s.disciplineBar}>
            <div style={{ ...s.disciplineFill, width: `${pct}%` }} />
          </div>
        </div>
        {practice.finalControl && (
          <div style={s.lsBlock}>
            <div style={s.lsBlockLabel}>Итоговый контроль</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <span style={{ ...s.fcChip, ...fcChipStyle(practice.finalControl.type) }}>
                {practice.finalControl.type}
              </span>
              <div style={practice.finalControl.confirmed ? s.fcDate : s.fcDatePlan}>
                {!practice.finalControl.confirmed && <span style={s.fcPlanDot} />}
                {!practice.finalControl.confirmed && "~ "}{practice.finalControl.date}
                {!practice.finalControl.confirmed && <span style={{ ...s.fcPlanLabel, marginLeft: 4 }}>планируется</span>}
              </div>
            </div>
          </div>
        )}
        <div style={{ color: "var(--c-text-dim)", fontSize: "0.78rem", marginTop: 8, lineHeight: 1.5 }}>
          Дни практики отображаются в расписании.
        </div>
      </div>
    </>
  );
}

// ── Модальное окно подтверждения ─────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, danger }: {
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div style={s.modalOverlay} onClick={onCancel}>
      <div style={s.modalBox} onClick={e => e.stopPropagation()}>
        <div style={s.modalTitle}>{title}</div>
        {message && <div style={s.modalMessage}>{message}</div>}
        <div style={s.modalActions}>
          <button style={s.modalCancelBtn} onClick={onCancel}>Отмена</button>
          <button style={{ ...s.modalConfirmBtn, ...(danger ? s.modalConfirmDanger : {}) }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Экран завершённого контекста ──────────────────────────────────────────────
function CompletedContextScreen({ context, onSwitchContext }: {
  context: LearnerContext;
  onSwitchContext: () => void;
}) {
  const disciplines = MOCK_COMPLETED_DISCIPLINES[context.id] ?? [];
  const gradeColor = (s: CompletedDiscipline["status"]) =>
    s === "passed" ? "var(--c-success)" : s === "failed" ? "var(--c-danger)" : "var(--c-text-muted)";

  return (
    <>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onSwitchContext}>
          <span style={{ fontSize: 20 }}>‹</span> Профили
        </button>
        <div style={s.subHeaderTitle}>Итоги обучения</div>
      </div>

      <div style={{ ...s.body, paddingTop: 16, flex: 1 }}>
        <div style={s.ctxCompletedMeta}>
          <div style={s.ctxName}>{context.name}</div>
          <div style={s.ctxPeriod}>{context.period} · Завершено {context.completedAt}</div>
        </div>

        <div style={{ ...s.sectionLabel, marginTop: 20 }}>Дисциплины и оценки</div>
        {disciplines.map(d => (
          <div key={d.id} style={s.completedDisciplineCard}>
            <div style={s.completedDisciplineInfo}>
              <div style={s.completedDisciplineTitle}>{d.title}</div>
              <div style={s.completedDisciplineMeta}>{d.totalLessons} занятий</div>
            </div>
            {d.grade && (
              <div style={{ ...s.completedGrade, color: gradeColor(d.status) }}>{d.grade}</div>
            )}
          </div>
        ))}
        {disciplines.length === 0 && (
          <div style={{ color: "var(--c-text-muted)", fontSize: "0.85rem", marginTop: 20, textAlign: "center" as const }}>
            Данные недоступны
          </div>
        )}
      </div>
    </>
  );
}

// ── Переключатель контекста ───────────────────────────────────────────────────
function ContextSwitcherScreen({ contexts, currentId, defaultId, onSelect, onSetDefault }: {
  contexts: LearnerContext[];
  currentId: string;
  defaultId: string;
  onSelect: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const active    = contexts.filter(c => c.status === "active");
  const completed = contexts.filter(c => c.status === "completed");

  return (
    <>
      <div style={{ ...s.body, paddingTop: 16, flex: 1 }}>

        <div style={s.sectionLabel}>Активные</div>
        {active.map(ctx => {
          const isCurrent = ctx.id === currentId;
          const isDefault = ctx.id === defaultId;
          return (
            <div
              key={ctx.id}
              style={{ ...s.ctxCard, ...(isCurrent ? s.ctxCardActive : {}) }}
              onClick={() => onSelect(ctx.id)}
            >
              <div style={s.ctxCardHead}>
                <span style={s.ctxTypeBadge}>{CONTEXT_TYPE_LABEL[ctx.type]}</span>
                {isDefault && <span style={s.ctxDefaultBadge}>По умолчанию</span>}
                {isCurrent && <span style={s.ctxCheck}>✓</span>}
              </div>
              <div style={s.ctxName}>{ctx.name}</div>
              <div style={s.ctxPeriod}>{ctx.period}</div>
              <button
                style={{ ...s.ctxSetDefaultBtn, ...(isDefault ? { visibility: "hidden" as const, cursor: "default" } : {}) }}
                onClick={isDefault ? undefined : e => { e.stopPropagation(); onSetDefault(ctx.id); }}
              >
                Сделать основным
              </button>
            </div>
          );
        })}

        {completed.length > 0 && (
          <>
            <div style={{ ...s.sectionLabel, marginTop: 20 }}>Завершено</div>
            {completed.map(ctx => (
              <div
                key={ctx.id}
                style={{ ...s.ctxCard, ...(ctx.id === currentId ? s.ctxCardActive : {}) }}
                onClick={() => onSelect(ctx.id)}
              >
                <div style={s.ctxCardHead}>
                  <span style={s.ctxTypeBadge}>{CONTEXT_TYPE_LABEL[ctx.type]}</span>
                  <span style={{ ...s.ctxDefaultBadge, color: "var(--c-text-muted)" }}>Завершено {ctx.completedAt}</span>
                  {ctx.id === currentId && <span style={s.ctxCheck}>✓</span>}
                </div>
                <div style={s.ctxName}>{ctx.name}</div>
                <div style={s.ctxPeriod}>{ctx.period}</div>
              </div>
            ))}
          </>
        )}

      </div>
    </>
  );
}

// ── Экран уведомлений ─────────────────────────────────────────────────────────
function NotificationsScreen({ notifications, onBack, onOpen, onRead, onReadAll }: {
  notifications: Notification[];
  onBack: () => void;
  onOpen: (n: Notification) => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  const hasUnread = notifications.some(n => !n.read);
  return (
    <>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> Назад
        </button>
        <div style={s.subHeaderTitle}>Уведомления</div>
        {hasUnread && (
          <button style={s.readAllBtn} onClick={onReadAll}>Прочитать все</button>
        )}
      </div>
      <div style={{ ...s.body, paddingTop: 16 }}>
        {notifications.length === 0
          ? <div style={s.empty}>Нет уведомлений</div>
          : notifications.map(n => {
            const hasDetail = !!n.fullText;
            return (
              <div
                key={n.id}
                style={{ ...s.notifCard, opacity: n.read ? 0.55 : 1, cursor: hasDetail ? "pointer" : "default" }}
                onClick={() => hasDetail ? onOpen(n) : onRead(n.id)}
              >
                <div style={s.notifHead}>
                  <span style={{ ...s.notifType, color: n.type === "system" ? "var(--c-purple)" : "var(--c-accent)" }}>
                    {n.type === "system" ? "Система" : "Univerkon"}
                  </span>
                  <span style={s.notifDate}>{formatDay(n.date)}</span>
                  {!n.read && <span style={s.notifDot} />}
                </div>
                <div style={s.notifRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.notifTitle}>{n.title}</div>
                    <div style={s.notifBody}>{n.body}</div>
                  </div>
                  {hasDetail && <span style={s.notifChevron}>›</span>}
                </div>
              </div>
            );
          })
        }
      </div>
    </>
  );
}

// ── Детальный экран уведомления ───────────────────────────────────────────────
function NotificationDetailScreen({ notification: n, onBack }: {
  notification: Notification;
  onBack: () => void;
}) {
  return (
    <>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> Назад
        </button>
        <div style={s.subHeaderTitle}>{n.title}</div>
      </div>
      <div style={{ ...s.body, paddingTop: 20, flex: 1 }}>
        <div style={s.notifDetailMeta}>
          <span style={{ ...s.notifType, color: n.type === "system" ? "var(--c-purple)" : "var(--c-accent)" }}>
            {n.type === "system" ? "Система" : "Univerkon"}
          </span>
          <span style={s.notifDate}>{formatDay(n.date)}</span>
        </div>
        <h2 style={s.notifDetailTitle}>{n.title}</h2>
        <p style={s.notifDetailBody}>{n.fullText}</p>
        {n.links && n.links.length > 0 && (
          <div style={s.notifLinks}>
            {n.links.map((lnk, i) => (
              <a key={i} href={lnk.url} style={s.notifLink} target="_blank" rel="noopener noreferrer">
                {lnk.label} →
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Экран занятия ─────────────────────────────────────────────────────────────
const ATTENDANCE_INFO: Record<AttendanceStatus, { label: string; color: string; icon: string }> = {
  present:        { label: "Присутствовал",                      color: "var(--c-success)", icon: "✓" },
  absent_excused: { label: "Отсутствовал (уважительная причина)", color: "#E5A94B",          icon: "!" },
  absent:         { label: "Отсутствовал",                       color: "var(--c-danger)",  icon: "✗" },
  worked_off:     { label: "Отсутствовал · Отработка зачтена",   color: "#E5A94B",          icon: "○" },
};

function LessonScreen({ lesson, onBack }: { lesson: MockLesson; onBack: () => void }) {
  const typeColor = LESSON_TYPE_COLOR[lesson.type];
  const [ratings, setRatings] = useState<Record<string, boolean | null>>(
    () => Object.fromEntries(LESSON_RATING_CRITERIA.map(c => [c, null]))
  );
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const allRated = Object.values(ratings).every(v => v !== null);
  const att = lesson.attendance ? ATTENDANCE_INFO[lesson.attendance] : null;

  return (
    <>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> Назад
        </button>
        <div style={s.subHeaderTitle}>{lesson.discipline}</div>
      </div>
      <div style={{ ...s.body, paddingTop: 16 }}>

        {/* Шапка занятия */}
        <div style={s.lessonHero}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ ...s.lessonTypeTag, background: hexToRgba(typeColor, 0.15), color: typeColor }}>
              {LESSON_TYPE_LABEL[lesson.type]}
            </span>
            <span style={s.lessonHeroDate}>{formatDay(lesson.date)} · {formatTime(lesson.date)}</span>
          </div>
          <div style={s.lessonHeroTopic}>{lesson.topic}</div>
        </div>

        {/* Кнопка «Открыть занятие» */}
        {lesson.status !== "locked" && (
          <button style={{
            ...s.launchBtn,
            background: lesson.status === "done" ? "var(--c-card)" : "var(--c-accent)",
            color: lesson.status === "done" ? "var(--c-text-secondary)" : "#fff",
            border: lesson.status === "done" ? "1px solid var(--c-border)" : "none",
            marginBottom: 20,
          }}>
            {lesson.status === "done" ? "↺  Открыть занятие снова" : "►  Открыть занятие"}
          </button>
        )}

        {/* Педагог */}
        {lesson.teacher && (
          <div style={s.lsBlock}>
            <div style={s.lsBlockLabel}>Педагог</div>
            <div style={s.teacherCard}>
              <div style={s.teacherName}>{lesson.teacher.name}</div>
              <div style={s.teacherMeta}>
                {lesson.teacher.title}{lesson.teacher.degree ? ` · ${lesson.teacher.degree}` : ""}
              </div>
            </div>
          </div>
        )}

        {/* Посещаемость */}
        <div style={s.lsBlock}>
          <div style={s.lsBlockLabel}>Посещаемость</div>
          {att ? (
            <div style={{ ...s.attendanceChip, color: att.color, borderColor: att.color }}>
              <span style={s.attendanceIcon}>{att.icon}</span> {att.label}
            </div>
          ) : (
            <div style={{ ...s.attendanceChip, color: "var(--c-text-dim)", borderColor: "var(--c-border)" }}>
              — Ожидается
            </div>
          )}
        </div>

        {/* Контроль */}
        {lesson.events && lesson.events.length > 0 && (
          <div style={s.lsBlock}>
            <div style={s.lsBlockLabel}>Контроль</div>
            {lesson.events.map((ev, i) => (
              <div key={i} style={{ ...s.eventBlock, marginTop: i > 0 ? 8 : 0 }}>
                {lesson.events!.length > 1 && (
                  <div style={s.eventTypeLabel}>
                    {ev.type}{ev.label ? ` · ${ev.label}` : ""}
                  </div>
                )}
                {ev.controls.map((ctrl, j) => (
                  <div key={j} style={s.controlRow}>
                    <span style={s.controlForm}>{ctrl.form}</span>
                    <span style={s.controlScore}>
                      {ctrl.score != null
                        ? <><span style={{ color: "var(--c-success)", fontWeight: 600 }}>{ctrl.score}</span><span style={{ color: "var(--c-text-muted)", fontSize: "0.7rem" }}>/{ctrl.maxScore}</span></>
                        : ctrl.result
                          ? <span style={{ color: "var(--c-text-secondary)" }}>{ctrl.result}</span>
                          : <span style={{ color: "var(--c-text-dim)" }}>— ожидается</span>
                      }
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Оценить занятие */}
        {lesson.status === "done" && MOCK_LESSON_RATING_ENABLED && (
          <div style={s.lsBlock}>
            <div style={s.lsBlockLabel}>Оценить занятие</div>
            {ratingSubmitted ? (
              <div style={s.ratingDone}>✓ Спасибо за оценку!</div>
            ) : (
              <>
                {LESSON_RATING_CRITERIA.map(c => (
                  <div key={c} style={s.ratingRow}>
                    <span style={s.ratingCriterion}>{c}</span>
                    <div style={s.ratingBtns}>
                      <button
                        style={{ ...s.ratingBtn, ...(ratings[c] === true ? s.ratingBtnYes : {}) }}
                        onClick={() => setRatings(r => ({ ...r, [c]: true }))}
                      >👍</button>
                      <button
                        style={{ ...s.ratingBtn, ...(ratings[c] === false ? s.ratingBtnNo : {}) }}
                        onClick={() => setRatings(r => ({ ...r, [c]: false }))}
                      >👎</button>
                    </div>
                  </div>
                ))}
                {allRated && (
                  <button style={s.ratingSubmitBtn} onClick={() => setRatingSubmitted(true)}>
                    Отправить оценку
                  </button>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </>
  );
}

// ── Зачётка ───────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<GradebookEntry["type"], string> = {
  exam: "Экз", test: "Зач", coursework: "КР",
};
const TYPE_LABEL_EN: Record<GradebookEntry["type"], string> = {
  exam: "Exam", test: "Test", coursework: "CW",
};

function gradeColor(v?: number) {
  if (!v) return "var(--c-text-muted)";
  if (v >= 5) return "var(--c-success)";
  if (v >= 4) return "var(--c-accent)";
  if (v >= 3) return "#E5A94B";
  return "var(--c-danger)";
}

function GradebookTab({ periodsPerYear, pms, t }: {
  periodsPerYear: number;
  pms?: MockPM[];
  t: (k: StringKey) => string;
}) {
  const isEn = t("gradebook") === "Grades";
  const typeLabel = isEn ? TYPE_LABEL_EN : TYPE_LABEL;

  // ── СПО-режим ──
  if (pms) {
    return (
      <div>
        {pms.map(pm => (
          <div key={pm.id} style={s.gbPmBlock}>
            {/* PM-заголовок */}
            <div style={s.gbPmHeader}>
              <span style={s.gbPmCode}>{pm.code}</span>
              <span style={s.gbPmTitle}>{pm.title}</span>
            </div>
            {/* МДК */}
            {pm.mdks.map(mdk => (
              <div key={mdk.id} style={s.gbRow}>
                <div style={s.gbTypeTag}>МДК</div>
                <div style={s.gbTitle}>
                  <span style={s.gbItemCode}>{mdk.code}</span>
                  {mdk.title}
                </div>
                <div style={{ ...s.gbGrade, color: mdk.brs != null && mdk.doneLessons > 0 ? "var(--c-accent)" : "var(--c-text-dim)" }}>
                  {mdk.brs != null && mdk.doneLessons > 0
                    ? <>{mdk.brs.current}<span style={{ fontSize: "0.6rem", fontWeight: 400 }}> /100</span></>
                    : "—"
                  }
                </div>
              </div>
            ))}
            {/* Практики */}
            {pm.practices.map(p => (
              <div key={p.id} style={s.gbRow}>
                <div style={s.gbTypeTag}>{p.code.startsWith("УП") ? "УП" : "ПП"}</div>
                <div style={s.gbTitle}>
                  <span style={s.gbItemCode}>{p.code}</span>
                  {p.title}
                </div>
                <div style={{ ...s.gbGrade, color: p.doneDays > 0 ? "var(--c-accent)" : "var(--c-text-dim)" }}>
                  {p.doneDays > 0
                    ? <>{p.doneDays}<span style={{ fontSize: "0.6rem", fontWeight: 400 }}> /{p.totalDays} дн</span></>
                    : "—"
                  }
                </div>
              </div>
            ))}
            {/* Итоговый контроль ПМ */}
            {pm.finalControl && (
              <div style={{ ...s.gbRow, ...s.gbPmFinal }}>
                <div style={{ ...s.gbTypeTag, background: "color-mix(in srgb, #7C5CBF 20%, transparent)", color: "#a97de8" }}>ЭК</div>
                <div style={s.gbTitle}>{pm.finalControl.type}</div>
                <div style={{ ...s.gbGrade, color: "var(--c-text-dim)" }}>—</div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ── ВУЗ-режим ──
  type Group = Record<number, Record<number, GradebookEntry[]>>;
  const byCourse = MOCK_GRADEBOOK.reduce<Group>((acc, e) => {
    if (!acc[e.course]) acc[e.course] = {};
    if (!acc[e.course][e.semester]) acc[e.course][e.semester] = [];
    acc[e.course][e.semester].push(e);
    return acc;
  }, {});
  const courses = Object.keys(byCourse).map(Number).sort((a, b) => a - b);
  const [selectedCourse, setSelectedCourse] = useState(() => Math.max(...courses));

  function semLabel(sem: number) {
    const within = ((sem - 1) % periodsPerYear) + 1;
    return `${t("semester")} ${sem} (${ROMAN[within - 1] ?? within})`;
  }

  return (
    <div>
      <CourseTabBar courses={courses} selected={selectedCourse} onSelect={setSelectedCourse} t={t} />
      {byCourse[selectedCourse] && Object.keys(byCourse[selectedCourse]).map(Number).sort((a, b) => a - b).map(sem => (
        <div key={sem}>
          <div style={s.sectionLabel}>{semLabel(sem)}</div>
          {byCourse[selectedCourse][sem].map(e => (
            <div key={e.id} style={s.gbRow}>
              <div style={s.gbTypeTag}>{typeLabel[e.type]}</div>
              <div style={s.gbTitle}>{e.title}</div>
              <div style={s.gbHours}>{e.hours} {t("credits")}</div>
              <div style={{ ...s.gbGrade, color: e.grade ? gradeColor(e.gradeValue) : e.brs != null ? "var(--c-accent)" : "var(--c-text-muted)" }}>
                {e.grade
                  ? e.grade
                  : e.brs != null
                    ? <>{e.brs}<span style={{ fontSize: "0.6rem", fontWeight: 400 }}> /100</span></>
                    : t("inProgress")
                }
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Профиль / настройки ──────────────────────────────────────────────────────
function ProfileTab({ locale, onChangeLocale, themeMode, onThemeChange, eiv, student, lkUrl, onLogout, t }: {
  locale: string;
  onChangeLocale: (l: "ru" | "en") => void;
  themeMode: ThemeMode;
  onThemeChange: (m: ThemeMode) => void;
  eiv?: string;
  student?: { lastName: string; firstName: string; patronymic: string };
  lkUrl?: string;
  onLogout?: () => void;
  t: (k: StringKey) => string;
}) {
  const themeOptions: { value: ThemeMode; key: StringKey }[] = [
    { value: "auto",  key: "themeAuto"  },
    { value: "light", key: "themeLight" },
    { value: "dark",  key: "themeDark"  },
  ];

  return (
    <div>
      {/* ЕИВ — выше личных данных */}
      {eiv && (
        <div style={s.profileBlock}>
          <div style={s.profileFieldLabel}>{t("eivFull")}</div>
          <div style={s.profileValue}>{eiv}</div>
        </div>
      )}

      {/* Личные данные */}
      {student && (
        <div style={s.profileBlock}>
          <div style={s.sectionLabel}>{t("personalInfo")}</div>
          {[
            { key: "lastName",   value: student.lastName   },
            { key: "firstName",  value: student.firstName  },
            { key: "patronymic", value: student.patronymic },
          ].map(({ key, value }) => (
            <div key={key} style={s.profileField}>
              <div style={s.profileFieldLabel}>{t(key as StringKey)}</div>
              <div style={s.profileFieldValue}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Перейти в ЛК */}
      {lkUrl && (
        <div style={s.profileBlock}>
          <a href={lkUrl} target="_blank" rel="noopener noreferrer" style={s.lkBtn}>
            {t("goToLk")} ↗
          </a>
        </div>
      )}

      <div style={s.profileBlock}>
        <div style={s.sectionLabel}>{t("language")}</div>
        <div style={s.settingRow}>
          {(["ru", "en"] as const).map(l => (
            <button
              key={l}
              style={{ ...s.optionBtn, ...(locale === l ? s.optionBtnActive : {}) }}
              onClick={() => onChangeLocale(l)}
            >
              {l === "ru" ? "Русский" : "English"}
            </button>
          ))}
        </div>
      </div>

      <div style={s.profileBlock}>
        <div style={s.sectionLabel}>{t("theme")}</div>
        <div style={s.settingRow}>
          {themeOptions.map(({ value, key }) => (
            <button
              key={value}
              style={{ ...s.optionBtn, ...(themeMode === value ? s.optionBtnActive : {}) }}
              onClick={() => onThemeChange(value)}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      {onLogout && (
        <div style={{ marginTop: 32 }}>
          <button style={s.logoutFullBtn} onClick={onLogout}>
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Иконки ────────────────────────────────────────────────────────────────────
function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4" />
    </svg>
  );
}
function BellIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function CalIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function BookIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
function GradebookIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
function PersonIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function LogoutIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function SwitchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 8 12 2 6 8"/>
      <polyline points="6 16 12 22 18 16"/>
    </svg>
  );
}
function MoonIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
}
function SunIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function AutoIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l5 3" strokeOpacity="0.5"/><path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" fillOpacity="0.12"/></svg>;
}
function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "light") return <SunIcon />;
  if (mode === "dark") return <MoonIcon />;
  return <AutoIcon />;
}

// ── Стили ─────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: { maxWidth: 480, width: "100%", margin: "0 auto", height: "100vh", background: "var(--c-bg)", display: "flex", flexDirection: "column", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", boxShadow: "0 0 60px rgba(0,0,0,0.7)" },
  header: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "var(--c-header)", borderBottom: "0.5px solid var(--c-border)", flexShrink: 0 },
  headerLogo: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  headerTitle: { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.06em" },
  contextBtn: { flex: 1, background: "color-mix(in srgb, var(--c-border) 40%, transparent)", border: "0.5px solid var(--c-border)", borderRadius: 8, cursor: "pointer", textAlign: "left", padding: "4px 8px", minWidth: 0 },
  contextName: { color: "var(--c-text-secondary)", fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  contextPeriod: { color: "var(--c-text-muted)", fontSize: "0.62rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  avatar: { width: 30, height: 30, borderRadius: "50%", background: "var(--c-border)", color: "var(--c-accent)", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  body: { flex: 1, padding: "12px 16px 12px", overflowY: "auto" },
  bottomNav: { background: "var(--c-header)", borderTop: "0.5px solid var(--c-border)", display: "flex", padding: "6px 0 10px", flexShrink: 0 },
  navItem: { flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0" },
  navLabel: { fontSize: "0.62rem", fontWeight: 500 },
  toggle: { display: "flex", background: "var(--c-card)", borderRadius: 8, padding: 3, marginBottom: 12 },
  toggleBtn: { flex: 1, border: "none", background: "none", color: "var(--c-text-muted)", fontSize: "0.82rem", fontWeight: 500, padding: "6px 0", borderRadius: 6, cursor: "pointer" },
  toggleActive: { background: "var(--c-border)", color: "var(--c-text-primary)" },
  dayStrip: { display: "flex", gap: 4, overflowX: "auto", marginBottom: 16, paddingBottom: 4 },
  dayBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "0 4px", flexShrink: 0 },
  dayBtnWd: { fontSize: "0.62rem", textTransform: "capitalize" as const },
  dayBtnNum: { width: 28, height: 28, borderRadius: "50%", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 },
  dayDot: { width: 4, height: 4, borderRadius: "50%" },
  sectionLabel: { color: "var(--c-text-muted)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 10, fontWeight: 600 },
  empty: { color: "var(--c-text-dim)", textAlign: "center" as const, padding: "32px 0", fontSize: "0.85rem" },
  lessonCard: { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" },
  lessonTypeTag: { borderRadius: 4, padding: "2px 6px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0, marginTop: 2 },
  lessonBody: { flex: 1, minWidth: 0 },
  lessonDate: { color: "var(--c-text-muted)", fontSize: "0.68rem", marginBottom: 2 },
  lessonDiscipline: { color: "var(--c-accent)", fontSize: "0.68rem", marginBottom: 3, fontWeight: 500 },
  lessonTopic: { fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.3 },
  lessonScore: { color: "var(--c-success)", fontSize: "0.7rem", marginTop: 4 },
  lessonLocked: { color: "var(--c-text-dim)", fontSize: "0.7rem", marginTop: 4 },
  lessonChevron: { color: "var(--c-text-dim)", fontSize: "1.2rem", lineHeight: 1, flexShrink: 0, alignSelf: "center" },
  lessonDoneDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--c-success)", flexShrink: 0, marginTop: 4 },
  disciplineCard: { width: "100%", background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left" as const },
  disciplineHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 },
  disciplineTitle: { color: "var(--c-text-primary)", fontSize: "0.88rem", fontWeight: 500 },
  progressChip: { color: "var(--c-text-muted)", fontSize: "0.75rem", flexShrink: 0 },
  gradeChip: { borderRadius: 4, padding: "2px 7px", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 },
  disciplineBar: { height: 2, background: "var(--c-progress-track)", borderRadius: 1 },
  disciplineFill: { height: "100%", background: "var(--c-accent)", borderRadius: 1 },
  subHeader: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--c-header)", borderBottom: "0.5px solid var(--c-border)", flexShrink: 0 },
  backBtn: { background: "none", border: "none", color: "var(--c-accent)", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  subHeaderTitle: { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  launchBtn: { width: "100%", maxWidth: 320, border: "none", borderRadius: 10, color: "#fff", fontSize: "0.95rem", fontWeight: 500, padding: "14px 20px", cursor: "pointer" },
  bellBtn: { position: "relative" as const, background: "none", border: "none", cursor: "pointer", color: "var(--c-text-muted)", padding: "2px", display: "flex", flexShrink: 0 },
  logoutBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--c-text-dim)", padding: "2px", display: "flex", flexShrink: 0 },
  bellBadge: { position: "absolute" as const, top: -2, right: -2, background: "var(--c-danger)", color: "#fff", fontSize: "0.55rem", fontWeight: 700, width: 14, height: 14, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  statusBar: { height: 24, background: "var(--c-status-bg)", borderTop: "0.5px solid var(--c-status-border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", flexShrink: 0 },
  versionBtn: { background: "none", border: "none", cursor: "pointer", padding: "0 2px", display: "flex", alignItems: "center", fontSize: "0.6rem", letterSpacing: "0.04em", lineHeight: 1 },
  versionLabel: { color: "var(--c-status-text)", fontSize: "0.6rem", letterSpacing: "0.04em" },
  updateBtn: { background: "none", border: "none", color: "var(--c-accent)", fontSize: "0.6rem", cursor: "pointer", padding: 0, fontWeight: 600, letterSpacing: "0.02em" },
  themeBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--c-status-text)", padding: 0, display: "flex", alignItems: "center", lineHeight: 1 },
  ctxCompletedMeta: { background: "var(--c-card)", borderRadius: 12, border: "1px solid var(--c-border)", padding: "14px 16px", marginBottom: 10 },
  completedDisciplineCard: { background: "var(--c-card)", borderRadius: 10, border: "1px solid var(--c-border)", padding: "14px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 },
  completedDisciplineInfo: { flex: 1, minWidth: 0 },
  completedDisciplineTitle: { color: "var(--c-text-primary)", fontSize: "0.88rem", fontWeight: 600 },
  completedDisciplineMeta: { color: "var(--c-text-muted)", fontSize: "0.73rem", marginTop: 3 },
  completedGrade: { fontSize: "0.82rem", fontWeight: 700, flexShrink: 0 },
  ctxCard: { background: "var(--c-card)", borderRadius: 12, border: "1px solid var(--c-border)", padding: "14px 16px", marginBottom: 10, cursor: "pointer" },
  ctxCardActive: { borderColor: "var(--c-accent)", boxShadow: "0 0 0 1px var(--c-accent)" },
  ctxCardHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  ctxTypeBadge: { fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--c-accent)", background: "color-mix(in srgb, var(--c-accent) 12%, transparent)", borderRadius: 4, padding: "2px 7px" },
  ctxDefaultBadge: { fontSize: "0.62rem", fontWeight: 600, color: "var(--c-success)", letterSpacing: "0.02em" },
  ctxCheck: { marginLeft: "auto", color: "var(--c-accent)", fontSize: "1rem", fontWeight: 700 },
  ctxName: { color: "var(--c-text-primary)", fontSize: "0.92rem", fontWeight: 600, marginBottom: 3 },
  ctxPeriod: { color: "var(--c-text-muted)", fontSize: "0.75rem" },
  ctxSetDefaultBtn: { background: "none", border: "none", padding: "6px 0 0", fontSize: "0.73rem", color: "var(--c-accent)", cursor: "pointer", display: "block", fontWeight: 500 },
  modalOverlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "0 24px" },
  modalBox: { background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 16, padding: "24px 20px 20px", width: "100%", maxWidth: 360 },
  modalTitle: { color: "var(--c-text-primary)", fontSize: "1rem", fontWeight: 700, marginBottom: 8, textAlign: "center" as const },
  modalMessage: { color: "var(--c-text-muted)", fontSize: "0.83rem", textAlign: "center" as const, marginBottom: 24, lineHeight: 1.5 },
  modalActions: { display: "flex", gap: 10 },
  modalCancelBtn: { flex: 1, background: "none", border: "1px solid var(--c-border)", borderRadius: 10, padding: "11px 0", color: "var(--c-text-secondary)", fontSize: "0.9rem", cursor: "pointer", fontWeight: 500 },
  modalConfirmBtn: { flex: 1, background: "var(--c-accent)", border: "none", borderRadius: 10, padding: "11px 0", color: "#fff", fontSize: "0.9rem", cursor: "pointer", fontWeight: 600 },
  modalConfirmDanger: { background: "var(--c-danger)" },
  readAllBtn: { background: "none", border: "none", color: "var(--c-accent)", fontSize: "0.75rem", cursor: "pointer", padding: "2px 0", fontWeight: 500, flexShrink: 0, marginLeft: "auto" },
  notifCard: { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px 14px", marginBottom: 8 },
  notifHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  notifRow: { display: "flex", alignItems: "flex-start", gap: 8 },
  notifType: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em" },
  notifDate: { color: "var(--c-text-dim)", fontSize: "0.65rem", flex: 1 },
  notifDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--c-accent)", flexShrink: 0 },
  notifTitle: { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 500, marginBottom: 4 },
  notifBody: { color: "var(--c-text-muted)", fontSize: "0.78rem", lineHeight: 1.5 },
  notifChevron: { color: "var(--c-text-dim)", fontSize: "1.2rem", lineHeight: 1.5, flexShrink: 0 },
  notifDetailMeta: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  notifDetailTitle: { color: "var(--c-text-primary)", fontSize: "1rem", fontWeight: 600, margin: "0 0 16px", lineHeight: 1.4 },
  notifDetailBody: { color: "var(--c-text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, margin: "0 0 24px", whiteSpace: "pre-wrap" as const },
  notifLinks: { display: "flex", flexDirection: "column" as const, gap: 10 },
  notifLink: { display: "block", color: "var(--c-accent)", fontSize: "0.88rem", fontWeight: 500, padding: "12px 16px", background: "var(--c-card)", border: "0.5px solid var(--c-border)", borderRadius: 10, textDecoration: "none" },
  // Таблы курсов
  courseTabBar: { display: "flex", gap: 6, overflowX: "auto" as const, padding: "4px 0 12px", scrollbarWidth: "none" as const },
  courseTab: { flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-text-secondary)", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" as const },
  courseTabActive: { background: "var(--c-accent)", borderColor: "var(--c-accent)", color: "#fff", fontWeight: 600 },
  // Иерархия дисциплин (теперь только заголовок семестра, без courseLabel)
  courseLabel: { color: "var(--c-text-primary)", fontSize: "0.82rem", fontWeight: 700, marginTop: 16, marginBottom: 8 },
  // Зачётка
  gbRow: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--c-card)", borderRadius: 8, border: "0.5px solid var(--c-border)", marginBottom: 6 },
  gbTypeTag: { fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.04em", color: "var(--c-text-muted)", background: "var(--c-border)", borderRadius: 3, padding: "2px 5px", flexShrink: 0 },
  gbTitle: { flex: 1, color: "var(--c-text-primary)", fontSize: "0.82rem", lineHeight: 1.3 },
  gbHours: { color: "var(--c-text-dim)", fontSize: "0.7rem", flexShrink: 0 },
  gbGrade: { fontSize: "0.85rem", fontWeight: 700, flexShrink: 0, minWidth: 40, textAlign: "right" as const },
  // Профиль / настройки
  profileBlock: { marginBottom: 24 },
  profileValue: { color: "var(--c-text-primary)", fontSize: "1rem", fontWeight: 600, marginTop: 4 },
  profileField: { marginTop: 10 },
  profileFieldLabel: { color: "var(--c-text-muted)", fontSize: "0.72rem", marginBottom: 2 },
  profileFieldValue: { color: "var(--c-text-primary)", fontSize: "0.95rem", fontWeight: 500 },
  lkBtn: { display: "block", padding: "11px 16px", borderRadius: 10, background: "var(--c-accent)", color: "#fff", textDecoration: "none", fontSize: "0.88rem", fontWeight: 600, textAlign: "center" as const },
  settingRow: { display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" as const },
  optionBtn: { border: "1px solid var(--c-border)", borderRadius: 8, padding: "8px 16px", background: "var(--c-card)", color: "var(--c-text-secondary)", fontSize: "0.85rem", cursor: "pointer", fontWeight: 500 },
  optionBtnActive: { borderColor: "var(--c-accent)", color: "var(--c-accent)", background: "color-mix(in srgb, var(--c-accent) 10%, transparent)" },
  logoutFullBtn: { width: "100%", border: "1px solid var(--c-danger)", borderRadius: 10, padding: "13px 0", background: "none", color: "var(--c-danger)", fontSize: "0.95rem", cursor: "pointer", fontWeight: 600 },
  // Шеврон контекста
  contextChevron: { opacity: 0.5, flexShrink: 0, display: "flex", color: "var(--c-text-muted)" },
  // Карточка дисциплины — расширенная
  disciplineDept: { color: "var(--c-text-muted)", fontSize: "0.7rem", marginTop: 1, marginBottom: 4 },
  brsBadge: { fontSize: "0.82rem", fontWeight: 700, color: "var(--c-accent)", flexShrink: 0 },
  brsMax: { fontSize: "0.68rem", fontWeight: 400, color: "var(--c-text-muted)" },
  disciplineFooter: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  lcRow: { color: "var(--c-text-secondary)", fontSize: "0.72rem", fontWeight: 500 },
  // Итоговый контроль
  fcWrap: { display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 2, flexShrink: 0 },
  fcChip: { fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.02em", padding: "2px 7px", borderRadius: 5 },
  fcDate: { fontSize: "0.67rem", color: "var(--c-text-secondary)" },
  fcDatePlan: { fontSize: "0.67rem", color: "var(--c-text-muted)", display: "flex", alignItems: "center", gap: 3 },
  fcPlanDot: { width: 5, height: 5, borderRadius: "50%", border: "1.5px solid currentColor", display: "inline-block", flexShrink: 0 },
  fcPlanLabel: { fontSize: "0.58rem", color: "var(--c-text-dim)" },
  // Экран занятия
  lessonHero: { marginBottom: 16, paddingBottom: 16, borderBottom: "0.5px solid var(--c-border)" },
  lessonHeroDate: { color: "var(--c-text-muted)", fontSize: "0.78rem" },
  lessonHeroTopic: { color: "var(--c-text-primary)", fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.35 },
  lsBlock: { marginBottom: 16 },
  lsBlockLabel: { color: "var(--c-text-dim)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 },
  teacherCard: { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px 14px" },
  teacherName: { color: "var(--c-text-primary)", fontSize: "0.88rem", fontWeight: 600 },
  teacherMeta: { color: "var(--c-text-muted)", fontSize: "0.75rem", marginTop: 3 },
  attendanceChip: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 500, padding: "7px 12px", borderRadius: 8, border: "1px solid", background: "transparent" },
  attendanceIcon: { fontStyle: "normal", fontWeight: 700, fontSize: "0.85rem" },
  eventBlock: { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "10px 14px" },
  eventTypeLabel: { color: "var(--c-text-muted)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.03em", marginBottom: 8 },
  controlRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 6, paddingBottom: 2 },
  controlForm: { color: "var(--c-text-secondary)", fontSize: "0.82rem" },
  controlScore: { fontSize: "0.88rem", fontWeight: 600, flexShrink: 0 },
  ratingRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 0", borderBottom: "0.5px solid var(--c-border)" },
  ratingCriterion: { color: "var(--c-text-secondary)", fontSize: "0.83rem", flex: 1 },
  ratingBtns: { display: "flex", gap: 6, flexShrink: 0 },
  ratingBtn: { background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 8, width: 36, height: 36, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.15s" },
  ratingBtnYes: { borderColor: "var(--c-success)", background: "color-mix(in srgb, var(--c-success) 12%, transparent)" },
  ratingBtnNo:  { borderColor: "var(--c-danger)",  background: "color-mix(in srgb, var(--c-danger)  12%, transparent)" },
  ratingSubmitBtn: { width: "100%", marginTop: 12, border: "none", borderRadius: 10, background: "var(--c-accent)", color: "#fff", fontSize: "0.88rem", fontWeight: 600, padding: "12px 0", cursor: "pointer" },
  ratingDone: { color: "var(--c-success)", fontSize: "0.88rem", fontWeight: 500, textAlign: "center" as const, padding: "12px 0" },
  // ПМ карточка
  pmCard: { width: "100%", background: "var(--c-card)", borderRadius: 12, border: "0.5px solid var(--c-border)", padding: "14px 16px", marginBottom: 10, cursor: "pointer", textAlign: "left" as const },
  pmHead: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 2 },
  pmCode: { color: "var(--c-accent)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 2 },
  pmTitle: { color: "var(--c-text-primary)", fontSize: "0.92rem", fontWeight: 600, lineHeight: 1.3 },
  pmFolderIcon: { color: "var(--c-text-dim)", fontSize: "1rem", flexShrink: 0, marginTop: 2 },
  pmComposition: { color: "var(--c-text-secondary)", fontSize: "0.75rem", fontWeight: 500, marginTop: 4 },
  // МДК code label
  mdkCode: { color: "var(--c-accent)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 2 },
  // БРС-детализация
  brsBlock: { background: "var(--c-card)", borderRadius: 12, border: "0.5px solid var(--c-border)", padding: "14px 16px", marginBottom: 16 },
  brsTotalRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  brsTotalLabel: { color: "var(--c-text-dim)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, flexShrink: 0 },
  brsTotalScore: { color: "var(--c-text-primary)", fontSize: "0.88rem", fontWeight: 700, flexShrink: 0 },
  brsGrid: { display: "flex", flexDirection: "column" as const, gap: 10 },
  brsGridItem: { paddingTop: 10, borderTop: "0.5px solid var(--c-border)" },
  brsItemRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  brsItemLabel: { fontSize: "0.82rem" },
  brsItemScore: { fontSize: "0.85rem", flexShrink: 0 },
  brsItemNote: { color: "var(--c-text-dim)", fontSize: "0.67rem", marginTop: 4 },
  // Зачётка СПО
  gbPmBlock: { marginBottom: 16, background: "var(--c-card)", borderRadius: 12, border: "0.5px solid var(--c-border)", overflow: "hidden" as const },
  gbPmHeader: { display: "flex", alignItems: "baseline", gap: 8, padding: "10px 14px", background: "color-mix(in srgb, var(--c-accent) 8%, transparent)", borderBottom: "0.5px solid var(--c-border)" },
  gbPmCode: { color: "var(--c-accent)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0 },
  gbPmTitle: { color: "var(--c-text-primary)", fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.3 },
  gbPmFinal: { borderTop: "0.5px solid var(--c-border)", background: "color-mix(in srgb, #7C5CBF 5%, transparent)" },
  gbItemCode: { display: "block", color: "var(--c-accent)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.03em", marginBottom: 1 },
};
