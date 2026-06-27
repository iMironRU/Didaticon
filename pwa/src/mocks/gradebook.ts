import type {
  GradebookResponse, GradebookSemester, GradebookEntry,
  GradebookPassed, GradebookInProgress, GradebookRetakeScheduled, GradebookRetakePending,
} from "@eios/contracts";
import { LearnerId, UnitId } from "@eios/contracts";
import { UNIT_IDS } from "./trajectory.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function passed(type: GradebookEntry["finalControl"]["type"], grade: GradebookPassed["grade"], date: string, teacher?: string): GradebookPassed {
  return { state: "passed", type, grade, date, teacher };
}
function inProgress(type: GradebookEntry["finalControl"]["type"], plannedDate?: string): GradebookInProgress {
  return { state: "in_progress", type, plannedDate };
}
function entry(unitId: ReturnType<typeof UnitId>, code: string, title: string, credits: number, finalControl: GradebookEntry["finalControl"], groupCode?: string, groupTitle?: string): GradebookEntry {
  return { unitId, code, title, credits, finalControl, groupCode, groupTitle };
}

// ── Semester history for ВО learner ──────────────────────────────────────────
const S1: GradebookSemester = {
  period: "2022-2023-autumn", label: "I курс · Осенний семестр 2023", isCurrent: false,
  entries: [
    entry(UnitId("g_s1_1"), "Б1.О.01", "Математика (ч. 1)",           3, passed("экзамен", 5, "2023-01-20", "Смирнова А.В.")),
    entry(UnitId("g_s1_2"), "Б1.О.02", "Введение в программирование", 2, passed("экзамен", 4, "2023-01-25", "Петров И.С.")),
    entry(UnitId("g_s1_3"), "Б1.О.03", "Дискретная математика",       2, passed("зачёт",   5, "2022-12-20")),
  ],
};

const S2: GradebookSemester = {
  period: "2022-2023-spring", label: "I курс · Весенний семестр 2023", isCurrent: false,
  entries: [
    entry(UnitId("g_s2_1"), "Б1.О.04", "Математика (ч. 2)",              3, passed("экзамен",  4, "2023-06-18", "Смирнова А.В.")),
    entry(UnitId("g_s2_2"), "Б1.О.05", "Алгоритмы и структуры данных",   3, passed("экзамен",  5, "2023-06-22", "Петров И.С.")),
    entry(UnitId("g_s2_3"), "Б1.О.06", "Физическая культура",            2, passed("зачёт",    5, "2023-05-31")),
  ],
};

const S3: GradebookSemester = {
  period: "2023-2024-autumn", label: "II курс · Осенний семестр 2024", isCurrent: false,
  entries: [
    entry(UnitId("g_s3_1"), "Б1.О.08", "ООП и паттерны проектирования", 3, passed("экзамен", 5, "2024-01-19", "Петров И.С.")),
    entry(UnitId("g_s3_2"), "Б1.О.09", "Операционные системы",          2, passed("экзамен", 4, "2024-01-24", "Сидоров А.Ю.")),
    entry(UnitId("g_s3_3"), "Б1.О.10", "Теория вероятностей",           2, passed("зачёт",   5, "2023-12-22")),
  ],
};

const S4: GradebookSemester = {
  period: "2023-2024-spring", label: "II курс · Весенний семестр 2024", isCurrent: false,
  entries: [
    entry(UnitId("g_s4_1"), "Б1.О.11", "Компьютерные сети",     3, passed("экзамен", 3, "2024-06-17", "Сидоров А.Ю.")),
    entry(UnitId("g_s4_2"), "Б1.О.12", "Базы данных (основы)",  2, passed("экзамен", 5, "2024-06-20", "Петров И.С.")),
    entry(UnitId("g_s4_3"), "Б1.О.13", "Курсовая работа",       1, passed("курсовая",5, "2024-06-25", "Петров И.С.")),
  ],
};

const S5: GradebookSemester = {
  period: "2024-2025-autumn", label: "III курс · Осенний семестр 2025", isCurrent: false,
  entries: [
    entry(UnitId("g_s5_1"), "Б1.О.14", "Архитектура ПО",  3, passed("экзамен", 4, "2025-01-22", "Петров И.С.")),
    entry(UnitId("g_s5_2"), "Б1.О.15", "Веб-технологии",  2, passed("экзамен", 5, "2025-01-27", "Сидоров А.Ю.")),
  ],
};

const S6: GradebookSemester = {
  period: "2024-2025-spring", label: "III курс · Весенний семестр 2025", isCurrent: false,
  entries: [
    entry(UnitId("g_s6_1"), "Б1.О.17", "Безопасность ИС",  2, passed("экзамен", 4, "2025-06-16", "Козлов П.Д.")),
    entry(UnitId("g_s6_2"), "Б1.О.18", "Курсовой проект",  1, passed("курсовая",5, "2025-06-23", "Петров И.С.")),
    // показываем один реальный кейс пересдачи — зачёт сдан со второй попытки
    entry(UnitId("g_s6_3"), "Б1.О.19", "Иностранный язык (англ.)", 2, passed("зачёт", 4, "2025-07-05", "Белова М.Ю.")),
  ],
};

// ── Текущий семестр (7) — незакрытые позиции ─────────────────────────────────
const retakePending: GradebookRetakePending = {
  state: "failed_retake_pending",
  type: "зачёт",
  attemptNumber: 1,
  isCommission: false,
};

const retakeScheduled: GradebookRetakeScheduled = {
  state: "failed_retake_scheduled",
  type: "зачёт",
  attemptNumber: 2,
  isCommission: false,
  retakeDate: "2026-07-15",
  availableSlots: [
    { bookingSlotId: "bs1", date: "2026-07-15", timeStart: "09:00", timeEnd: "10:30", room: "Ауд. 312", availableSpots: 5,
      teacher: { name: "Сидоров Алексей Юрьевич", position: "Старший преподаватель" } },
    { bookingSlotId: "bs2", date: "2026-07-15", timeStart: "11:00", timeEnd: "12:30", room: "Ауд. 312", availableSpots: 3,
      teacher: { name: "Сидоров Алексей Юрьевич", position: "Старший преподаватель" } },
    { bookingSlotId: "bs3", date: "2026-07-17", timeStart: "14:00", timeEnd: "15:30", room: "Ауд. 215", availableSpots: 8,
      teacher: { name: "Петров Иван Сергеевич", position: "Доцент", degree: "к.т.н." } },
  ],
};

const S7_CURRENT: GradebookSemester = {
  period: "2025-2026-spring", label: "IV курс · Весенний семестр 2026", isCurrent: true,
  entries: [
    entry(UNIT_IDS.DB,   "Б1.О.16", "Базы данных",                       3, inProgress("экзамен", "2027-01-15")),
    entry(UNIT_IDS.MATH, "Б1.О.07", "Математический анализ",             2, inProgress("экзамен", "2027-01-20")),
    entry(UNIT_IDS.LAW,  "Б1.О.23", "Правовое регулирование в сфере ИТ", 2, inProgress("зачёт",   "2027-01-10")),
    // Демо: незачтённая дисциплина с ожиданием пересдачи
    entry(UnitId("g_s7_4"), "Б1.О.20", "Теория алгоритмов", 2, retakePending),
    // Демо: назначена пересдача — показывает UI записи на слот
    entry(UnitId("g_s7_5"), "Б1.О.21", "Сети передачи данных", 2, retakeScheduled),
  ],
};

// ── Export ────────────────────────────────────────────────────────────────────
export const MOCK_GRADEBOOK_VO: GradebookResponse = {
  learnerId: LearnerId("learner_vo_1"),
  semesters: [S1, S2, S3, S4, S5, S6, S7_CURRENT],
};

// ── СПО gradebook (упрощённый — только ПМ с итогами) ─────────────────────────
export const MOCK_GRADEBOOK_SPO: GradebookResponse = {
  learnerId: LearnerId("learner_spo_1"),
  semesters: [
    {
      period: "2023-2024-autumn", label: "СПО · Осенний семестр 2024", isCurrent: false,
      entries: [
        entry(UnitId("g_spo_1"), "ОП.01", "Основы программирования", 3, passed("экзамен",  4, "2024-01-18")),
        entry(UnitId("g_spo_2"), "ОП.02", "Основы электроники",       2, passed("зачёт",    5, "2023-12-15")),
      ],
    },
    {
      period: "2024-2025-spring", label: "СПО · Весенний семестр 2025", isCurrent: false,
      entries: [
        entry(UnitId("g_spo_3"), "ОП.03", "Компьютерные сети",      2, passed("зачёт",    5, "2025-05-28")),
        entry(UnitId("g_spo_4"), "ОП.04", "Основы алгоритмизации",  2, passed("экзамен",  5, "2025-06-10")),
      ],
    },
    {
      period: "2025-2026-spring", label: "СПО · 3 семестр 2025–2026", isCurrent: true,
      entries: [
        entry(UNIT_IDS.MDK0101, "МДК.01.01", "Разработка ПО на языках высокого уровня", 4, inProgress("дифзачёт", "2026-04-15"), "ПМ.01", "Разработка программного обеспечения"),
        entry(UNIT_IDS.MDK0102, "МДК.01.02", "Тестирование программных модулей",        3, inProgress("зачёт",    "2026-05-22"), "ПМ.01", "Разработка программного обеспечения"),
        entry(UNIT_IDS.UP01,    "УП.01",     "Учебная практика",                        2, inProgress("дифзачёт", "2026-06-05"), "ПМ.01", "Разработка программного обеспечения"),
        entry(UNIT_IDS.PM01,    "ПМ.01",     "Разработка программного обеспечения",     0, inProgress("ЭК",       "2026-06-14")),
      ],
    },
  ],
};
