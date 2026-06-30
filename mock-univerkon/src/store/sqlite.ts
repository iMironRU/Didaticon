import Database from "better-sqlite3";

// ── Schema ────────────────────────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS persons (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  short_name   TEXT NOT NULL,
  birth_date   TEXT,
  group_name   TEXT,
  course       INTEGER,
  teacher_title TEXT
);

CREATE TABLE IF NOT EXISTS schedule_slots (
  id                TEXT PRIMARY KEY,
  person_id         TEXT NOT NULL,
  person_type       TEXT NOT NULL,  -- 'student' | 'teacher'
  starts_at         TEXT NOT NULL,
  ends_at           TEXT NOT NULL,
  discipline_title  TEXT NOT NULL,
  slot_kind         TEXT NOT NULL,  -- 'lecture' | 'seminar' | 'lab' | 'exam'
  teacher_name      TEXT,
  group_name        TEXT,
  format            TEXT NOT NULL DEFAULT 'offline',
  room              TEXT,
  meeting_url       TEXT
);

CREATE TABLE IF NOT EXISTS gradebook_entries (
  id                TEXT PRIMARY KEY,
  student_id        TEXT NOT NULL,
  discipline_id     TEXT NOT NULL,
  discipline_title  TEXT NOT NULL,
  credits           INTEGER NOT NULL DEFAULT 3,
  grade             TEXT,
  grade_label       TEXT,
  graded_date       TEXT,
  form_kind         TEXT NOT NULL DEFAULT 'exam'
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_marks (
  slot_id    TEXT NOT NULL,
  student_id TEXT NOT NULL,
  present    INTEGER NOT NULL DEFAULT 0,
  score      REAL,
  note       TEXT,
  PRIMARY KEY (slot_id, student_id)
);

CREATE TABLE IF NOT EXISTS chaos_config (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  latency_min      INTEGER NOT NULL DEFAULT 0,
  latency_max      INTEGER NOT NULL DEFAULT 0,
  error_rate       REAL NOT NULL DEFAULT 0,
  error_statuses   TEXT NOT NULL DEFAULT '[503]',
  error_methods    TEXT NOT NULL DEFAULT '[]',
  partial_responses INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO chaos_config (id) VALUES (1);
`;

// ── Seed data ─────────────────────────────────────────────────────────────────
// today() offsets relative to 2026-06-30 (Tuesday)

function offsetISO(baseDayOffset: number, hour: number, minute = 0): string {
  const d = new Date("2026-06-30T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + baseDayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const DEFAULT_SEED = {
  persons: [
    { id: "s-test-1",    type: "student", full_name: "Иванова Мария Петровна",     short_name: "Иванова М.П.",    birth_date: "2004-03-15", group_name: "ИС-21-1",  course: 3, teacher_title: null },
    { id: "s-fail-1",    type: "student", full_name: "Петров Алексей Сергеевич",   short_name: "Петров А.С.",     birth_date: "2003-07-22", group_name: "ИС-21-1",  course: 3, teacher_title: null },
    { id: "t-test-1",    type: "teacher", full_name: "Петров Василий Алексеевич",  short_name: "Петров В.А.",     birth_date: null,         group_name: null,       course: null, teacher_title: "ст. преподаватель" },
    { id: "t-curator-1", type: "teacher", full_name: "Кузнецова Елена Ивановна",   short_name: "Кузнецова Е.И.", birth_date: null,         group_name: null,       course: null, teacher_title: "доцент, к.т.н." },
    { id: "t-sg-1",      type: "teacher", full_name: "Зайцев Дмитрий Олегович",   short_name: "Зайцев Д.О.",    birth_date: null,         group_name: null,       course: null, teacher_title: "старший методист" },
    { id: "par-test-1",  type: "parent",  full_name: "Иванова Светлана Николаевна", short_name: "Иванова С.Н.", birth_date: null,         group_name: null,       course: null, teacher_title: null },
  ],

  schedule_slots: [
    // ── Студент s-test-1: расписание пн–пт
    { id: "sl-s1-mon-1", person_id: "s-test-1", person_type: "student", starts_at: offsetISO(-1, 8, 30),  ends_at: offsetISO(-1, 10, 0),  discipline_title: "Алгоритмы и структуры данных", slot_kind: "lecture",  teacher_name: "Петров В.А.",     group_name: null, format: "offline", room: "301",  meeting_url: null },
    { id: "sl-s1-mon-2", person_id: "s-test-1", person_type: "student", starts_at: offsetISO(-1, 10, 15), ends_at: offsetISO(-1, 11, 45), discipline_title: "Дискретная математика",         slot_kind: "seminar",  teacher_name: "Кузнецова Е.И.", group_name: null, format: "offline", room: "205",  meeting_url: null },
    { id: "sl-s1-tue-1", person_id: "s-test-1", person_type: "student", starts_at: offsetISO(0, 10, 15),  ends_at: offsetISO(0, 11, 45),  discipline_title: "Операционные системы",         slot_kind: "lab",      teacher_name: "Зайцев Д.О.",    group_name: null, format: "offline", room: "117л", meeting_url: null },
    { id: "sl-s1-tue-2", person_id: "s-test-1", person_type: "student", starts_at: offsetISO(0, 13, 0),   ends_at: offsetISO(0, 14, 30),  discipline_title: "Алгоритмы и структуры данных", slot_kind: "seminar",  teacher_name: "Петров В.А.",     group_name: null, format: "online", room: null,   meeting_url: "https://meet.example.com/asd" },
    { id: "sl-s1-wed-1", person_id: "s-test-1", person_type: "student", starts_at: offsetISO(1, 8, 30),   ends_at: offsetISO(1, 10, 0),   discipline_title: "Математический анализ",        slot_kind: "lecture",  teacher_name: "Кузнецова Е.И.", group_name: null, format: "offline", room: "301",  meeting_url: null },
    { id: "sl-s1-thu-1", person_id: "s-test-1", person_type: "student", starts_at: offsetISO(2, 10, 15),  ends_at: offsetISO(2, 11, 45),  discipline_title: "Дискретная математика",         slot_kind: "exam",     teacher_name: "Зайцев Д.О.",    group_name: null, format: "offline", room: "Акт", meeting_url: null },
    // ── Учитель t-test-1: расписание
    { id: "sl-t1-mon-1", person_id: "t-test-1", person_type: "teacher", starts_at: offsetISO(-1, 8, 30),  ends_at: offsetISO(-1, 10, 0),  discipline_title: "Алгоритмы и структуры данных", slot_kind: "lecture",  teacher_name: null, group_name: "ИС-21-1", format: "offline", room: "301",  meeting_url: null },
    { id: "sl-t1-tue-1", person_id: "t-test-1", person_type: "teacher", starts_at: offsetISO(0, 10, 15),  ends_at: offsetISO(0, 11, 45),  discipline_title: "Алгоритмы и структуры данных", slot_kind: "seminar",  teacher_name: null, group_name: "ИС-21-1", format: "online", room: null, meeting_url: "https://meet.example.com/asd" },
    { id: "sl-t1-wed-1", person_id: "t-test-1", person_type: "teacher", starts_at: offsetISO(1, 13, 0),   ends_at: offsetISO(1, 14, 30),  discipline_title: "Алгоритмы и структуры данных", slot_kind: "lab",      teacher_name: null, group_name: "ИС-21-2", format: "offline", room: "117л", meeting_url: null },
  ],

  gradebook_entries: [
    { id: "gb-s1-1", student_id: "s-test-1", discipline_id: "disc:history",  discipline_title: "История России",           credits: 2, grade: "5", grade_label: "Отлично",         graded_date: "2026-01-20", form_kind: "test" },
    { id: "gb-s1-2", student_id: "s-test-1", discipline_id: "disc:math1",    discipline_title: "Математический анализ ч.1", credits: 4, grade: "4", grade_label: "Хорошо",          graded_date: "2026-01-25", form_kind: "exam" },
    { id: "gb-s1-3", student_id: "s-test-1", discipline_id: "disc:prog1",    discipline_title: "Программирование ч.1",      credits: 3, grade: "5", grade_label: "Отлично",         graded_date: "2026-01-22", form_kind: "differential_test" },
    { id: "gb-s1-4", student_id: "s-test-1", discipline_id: "disc:dm",       discipline_title: "Дискретная математика",     credits: 3, grade: null, grade_label: null,             graded_date: null,         form_kind: "exam" },
    { id: "gb-s1-5", student_id: "s-test-1", discipline_id: "disc:os",       discipline_title: "Операционные системы",     credits: 3, grade: null, grade_label: null,             graded_date: null,         form_kind: "differential_test" },
    // Failing student
    { id: "gb-sf-1", student_id: "s-fail-1", discipline_id: "disc:math1",    discipline_title: "Математический анализ ч.1", credits: 4, grade: "2", grade_label: "Неудовлетворительно", graded_date: "2026-01-25", form_kind: "exam" },
    { id: "gb-sf-2", student_id: "s-fail-1", discipline_id: "disc:history",  discipline_title: "История России",           credits: 2, grade: "3", grade_label: "Удовлетворительно",   graded_date: "2026-01-20", form_kind: "test" },
    { id: "gb-sf-3", student_id: "s-fail-1", discipline_id: "disc:prog1",    discipline_title: "Программирование ч.1",      credits: 3, grade: "2", grade_label: "Неудовлетворительно", graded_date: "2026-01-22", form_kind: "differential_test" },
  ],

  notifications: [
    { id: "n-s1-1", student_id: "s-test-1", type: "schedule_change", title: "Изменение в расписании",    body: "Занятие по ОС в среду перенесено в ауд. 204.",     read: 0, created_at: offsetISO(-2, 9, 0) },
    { id: "n-s1-2", student_id: "s-test-1", type: "deadline",        title: "Срок сдачи приближается",   body: "До дедлайна КР №2 по Дискретной математике — 1 сутки.", read: 0, created_at: offsetISO(0, 7, 0) },
    { id: "n-s1-3", student_id: "s-test-1", type: "grade",           title: "Оценка выставлена",         body: "По дисциплине «Программирование» выставлено «Отлично».", read: 1, created_at: offsetISO(-30, 14, 0) },
    { id: "n-sf-1", student_id: "s-fail-1", type: "academic_debt",   title: "Академическая задолженность", body: "Вы не сдали экзамен по Мат. анализу. Пересдача — 2026-07-15.", read: 0, created_at: offsetISO(-5, 10, 0) },
  ],

  attendance_marks: [
    { slot_id: "sl-t1-mon-1", student_id: "s-test-1", present: 1, score: null, note: null },
    { slot_id: "sl-t1-mon-1", student_id: "s-fail-1", present: 0, score: null, note: "Не явился" },
  ],
};

// ── Database init ─────────────────────────────────────────────────────────────

export function initDb(sqlitePath: string): Database.Database {
  const db = new Database(sqlitePath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  loadSeed(db, DEFAULT_SEED);
  return db;
}

export function loadSeed(db: Database.Database, seed: typeof DEFAULT_SEED): void {
  const tx = db.transaction(() => {
    db.exec(`
      DELETE FROM attendance_marks;
      DELETE FROM notifications;
      DELETE FROM gradebook_entries;
      DELETE FROM schedule_slots;
      DELETE FROM persons;
    `);

    const insertPerson = db.prepare(`
      INSERT OR REPLACE INTO persons (id, type, full_name, short_name, birth_date, group_name, course, teacher_title)
      VALUES (@id, @type, @full_name, @short_name, @birth_date, @group_name, @course, @teacher_title)
    `);
    seed.persons.forEach(p => insertPerson.run(p));

    const insertSlot = db.prepare(`
      INSERT OR REPLACE INTO schedule_slots
        (id, person_id, person_type, starts_at, ends_at, discipline_title, slot_kind, teacher_name, group_name, format, room, meeting_url)
      VALUES
        (@id, @person_id, @person_type, @starts_at, @ends_at, @discipline_title, @slot_kind, @teacher_name, @group_name, @format, @room, @meeting_url)
    `);
    seed.schedule_slots.forEach(s => insertSlot.run(s));

    const insertGb = db.prepare(`
      INSERT OR REPLACE INTO gradebook_entries
        (id, student_id, discipline_id, discipline_title, credits, grade, grade_label, graded_date, form_kind)
      VALUES
        (@id, @student_id, @discipline_id, @discipline_title, @credits, @grade, @grade_label, @graded_date, @form_kind)
    `);
    seed.gradebook_entries.forEach(g => insertGb.run(g));

    const insertNotif = db.prepare(`
      INSERT OR REPLACE INTO notifications (id, student_id, type, title, body, read, created_at)
      VALUES (@id, @student_id, @type, @title, @body, @read, @created_at)
    `);
    seed.notifications.forEach(n => insertNotif.run(n));

    const insertMark = db.prepare(`
      INSERT OR REPLACE INTO attendance_marks (slot_id, student_id, present, score, note)
      VALUES (@slot_id, @student_id, @present, @score, @note)
    `);
    seed.attendance_marks.forEach(m => insertMark.run(m));
  });
  tx();
}
