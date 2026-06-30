/**
 * Сценарии меняют данные в SQLite, не пользователей Auth0.
 * Один Auth0-юзер `student@didacticon.test` → studentId=s-test-1
 * → разные сценарии меняют что лежит в БД для s-test-1.
 */
import type Database from "better-sqlite3";
import { DEFAULT_SEED, loadSeed } from "../store/sqlite.js";

type Seed = typeof DEFAULT_SEED;

function offsetISO(baseDayOffset: number, hour: number, minute = 0): string {
  const d = new Date("2026-06-30T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + baseDayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ── Сценарий: студент-отличник ────────────────────────────────────────────────
const STUDENT_PERFECT: Seed = {
  ...DEFAULT_SEED,
  gradebook_entries: [
    { id: "gb-s1-1", student_id: "s-test-1", discipline_id: "disc:history",  discipline_title: "История России",           credits: 2, grade: "5", grade_label: "Отлично", graded_date: "2026-01-20", form_kind: "test" },
    { id: "gb-s1-2", student_id: "s-test-1", discipline_id: "disc:math1",    discipline_title: "Математический анализ",    credits: 4, grade: "5", grade_label: "Отлично", graded_date: "2026-01-25", form_kind: "exam" },
    { id: "gb-s1-3", student_id: "s-test-1", discipline_id: "disc:prog1",    discipline_title: "Программирование",         credits: 3, grade: "5", grade_label: "Отлично", graded_date: "2026-01-22", form_kind: "differential_test" },
    { id: "gb-s1-4", student_id: "s-test-1", discipline_id: "disc:dm",       discipline_title: "Дискретная математика",    credits: 3, grade: "5", grade_label: "Отлично", graded_date: "2026-06-15", form_kind: "exam" },
    { id: "gb-s1-5", student_id: "s-test-1", discipline_id: "disc:os",       discipline_title: "Операционные системы",    credits: 3, grade: "5", grade_label: "Отлично", graded_date: "2026-06-18", form_kind: "differential_test" },
  ],
  notifications: [
    { id: "n-s1-1", student_id: "s-test-1", type: "grade", title: "Оценка выставлена", body: "По Дискретной математике выставлено «Отлично».", read: 0, created_at: offsetISO(-1, 14, 0) },
  ],
};

// ── Сценарий: студент с долгами ───────────────────────────────────────────────
const STUDENT_WITH_DEBTS: Seed = {
  ...DEFAULT_SEED,
  gradebook_entries: [
    { id: "gb-s1-1", student_id: "s-test-1", discipline_id: "disc:history",  discipline_title: "История России",        credits: 2, grade: "4", grade_label: "Хорошо",              graded_date: "2026-01-20", form_kind: "test" },
    { id: "gb-s1-2", student_id: "s-test-1", discipline_id: "disc:math1",    discipline_title: "Математический анализ", credits: 4, grade: "2", grade_label: "Неудовлетворительно", graded_date: "2026-01-25", form_kind: "exam" },
    { id: "gb-s1-3", student_id: "s-test-1", discipline_id: "disc:prog1",    discipline_title: "Программирование",      credits: 3, grade: "4", grade_label: "Хорошо",              graded_date: "2026-01-22", form_kind: "differential_test" },
    { id: "gb-s1-4", student_id: "s-test-1", discipline_id: "disc:dm",       discipline_title: "Дискретная математика", credits: 3, grade: "2", grade_label: "Неудовлетворительно", graded_date: "2026-01-28", form_kind: "exam" },
    { id: "gb-s1-5", student_id: "s-test-1", discipline_id: "disc:os",       discipline_title: "Операционные системы", credits: 3, grade: null, grade_label: null,                 graded_date: null,         form_kind: "differential_test" },
  ],
  notifications: [
    { id: "n-s1-1", student_id: "s-test-1", type: "academic_debt", title: "Задолженность",           body: "Задолженность по Мат. анализу. Пересдача — 2026-07-15.",   read: 0, created_at: offsetISO(-3, 10, 0) },
    { id: "n-s1-2", student_id: "s-test-1", type: "academic_debt", title: "Задолженность",           body: "Задолженность по Дискретной математике. Пересдача — 2026-07-17.", read: 0, created_at: offsetISO(-2, 10, 0) },
    { id: "n-s1-3", student_id: "s-test-1", type: "deadline",      title: "Срок сдачи приближается", body: "Пересдача Мат. анализа через 15 дней.", read: 0, created_at: offsetISO(0, 8, 0) },
  ],
};

// ── Сценарий: студент на грани отчисления ─────────────────────────────────────
const STUDENT_FAILING: Seed = {
  ...DEFAULT_SEED,
  gradebook_entries: [
    { id: "gb-s1-1", student_id: "s-test-1", discipline_id: "disc:history",  discipline_title: "История России",        credits: 2, grade: "2",  grade_label: "Неудовлетворительно", graded_date: "2026-01-20", form_kind: "test" },
    { id: "gb-s1-2", student_id: "s-test-1", discipline_id: "disc:math1",    discipline_title: "Математический анализ", credits: 4, grade: "2",  grade_label: "Неудовлетворительно", graded_date: "2026-01-25", form_kind: "exam" },
    { id: "gb-s1-3", student_id: "s-test-1", discipline_id: "disc:prog1",    discipline_title: "Программирование",      credits: 3, grade: "3",  grade_label: "Удовлетворительно",   graded_date: "2026-01-22", form_kind: "differential_test" },
    { id: "gb-s1-4", student_id: "s-test-1", discipline_id: "disc:dm",       discipline_title: "Дискретная математика", credits: 3, grade: "2",  grade_label: "Неудовлетворительно", graded_date: "2026-01-28", form_kind: "exam" },
    { id: "gb-s1-5", student_id: "s-test-1", discipline_id: "disc:os",       discipline_title: "Операционные системы", credits: 3, grade: "2",  grade_label: "Неудовлетворительно", graded_date: "2026-01-30", form_kind: "differential_test" },
  ],
  notifications: [
    { id: "n-s1-1", student_id: "s-test-1", type: "academic_debt", title: "Угроза отчисления",     body: "3 задолженности не ликвидированы. Комиссия 2026-08-01.", read: 0, created_at: offsetISO(-1, 9, 0) },
    { id: "n-s1-2", student_id: "s-test-1", type: "academic_debt", title: "Пересдача по Мат. ан.", body: "Пересдача 2026-07-15, ауд. 301.",                         read: 0, created_at: offsetISO(-2, 10, 0) },
    { id: "n-s1-3", student_id: "s-test-1", type: "academic_debt", title: "Комиссия",              body: "Комиссия по Дискретной математике — 2026-07-20.",          read: 0, created_at: offsetISO(-1, 10, 0) },
  ],
};

// ── Сценарий: педагог с загруженным днём ─────────────────────────────────────
const TEACHER_BUSY_DAY: Seed = {
  ...DEFAULT_SEED,
  schedule_slots: [
    { id: "sl-t1-a", person_id: "t-test-1", person_type: "teacher", starts_at: offsetISO(0, 8, 30),  ends_at: offsetISO(0, 10, 0),  discipline_title: "Алгоритмы и структуры данных", slot_kind: "lecture",  teacher_name: null, group_name: "ИС-21-1", format: "offline", room: "301",  meeting_url: null },
    { id: "sl-t1-b", person_id: "t-test-1", person_type: "teacher", starts_at: offsetISO(0, 10, 15), ends_at: offsetISO(0, 11, 45), discipline_title: "Алгоритмы и структуры данных", slot_kind: "seminar",  teacher_name: null, group_name: "ИС-21-2", format: "offline", room: "205",  meeting_url: null },
    { id: "sl-t1-c", person_id: "t-test-1", person_type: "teacher", starts_at: offsetISO(0, 13, 0),  ends_at: offsetISO(0, 14, 30), discipline_title: "Математический анализ",         slot_kind: "lab",      teacher_name: null, group_name: "ИС-22-1", format: "online", room: null,   meeting_url: "https://meet.example.com/ma" },
    { id: "sl-t1-d", person_id: "t-test-1", person_type: "teacher", starts_at: offsetISO(0, 15, 0),  ends_at: offsetISO(0, 16, 30), discipline_title: "Алгоритмы и структуры данных", slot_kind: "exam",     teacher_name: null, group_name: "ИС-21-1", format: "offline", room: "Акт", meeting_url: null },
    // сохраняем слоты студентов без изменений
    ...DEFAULT_SEED.schedule_slots.filter(s => s.person_type === "student"),
  ],
};

// ── Реестр сценариев ──────────────────────────────────────────────────────────

export const SCENARIOS: Record<string, { title: string; seed: Seed }> = {
  "default":           { title: "По умолчанию (seed)",              seed: DEFAULT_SEED },
  "student-perfect":   { title: "Студент-отличник",                 seed: STUDENT_PERFECT },
  "student-with-debts":{ title: "Студент с задолженностями",        seed: STUDENT_WITH_DEBTS },
  "student-failing":   { title: "Студент на грани отчисления",      seed: STUDENT_FAILING },
  "teacher-busy-day":  { title: "Педагог: загруженный день",        seed: TEACHER_BUSY_DAY },
};

let _activeName = "default";

export function listScenarios() {
  return Object.entries(SCENARIOS).map(([id, s]) => ({ id, title: s.title, active: id === _activeName }));
}

export function loadScenario(db: Database.Database, id: string): void {
  const s = SCENARIOS[id];
  if (!s) throw new Error(`Сценарий не найден: ${id}`);
  loadSeed(db, s.seed);
  _activeName = id;
}

export function currentScenario() {
  return { id: _activeName, title: SCENARIOS[_activeName]?.title ?? "?" };
}
