import { useState, useEffect } from "react";
import type { StudentId } from "@eios/contracts";
import { onSwUpdate, applySwUpdate } from "../sw-update.js";

// ── Мок-данные ────────────────────────────────────────────────────────────────
type LessonType = "lecture" | "practice" | "lab";
type LessonStatus = "done" | "available" | "locked";

interface MockLesson {
  id: string;
  type: LessonType;
  topic: string;
  discipline: string;
  date: Date;
  status: LessonStatus;
  score?: number;       // 0–100 если пройдено
  grade?: string;       // оценка от преподавателя если есть
}

interface MockDiscipline {
  id: string;
  title: string;
  totalLessons: number;
  doneLessons: number;
  grade?: string;
  lessons: MockLesson[];
}

const TODAY = new Date(2026, 5, 26); // 26 июня 2026

function d(offsetDays: number, h = 10, m = 0) {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(h, m, 0, 0);
  return dt;
}

const MOCK_LESSONS: MockLesson[] = [
  { id: "l1",  type: "lecture",  topic: "Реляционная модель данных",         discipline: "Базы данных",             date: d(-7, 9),  status: "done",      score: 88  },
  { id: "l2",  type: "practice", topic: "SQL: SELECT и JOIN",                 discipline: "Базы данных",             date: d(-5, 11), status: "done",      score: 74  },
  { id: "l3",  type: "lecture",  topic: "Нормализация и денормализация",      discipline: "Базы данных",             date: d(-3, 9),  status: "done",      score: 91  },
  { id: "l4",  type: "lab",      topic: "Проектирование схемы БД",            discipline: "Базы данных",             date: d(-1, 13), status: "done",      score: 65  },
  { id: "l5",  type: "lecture",  topic: "Индексы и оптимизация запросов",     discipline: "Базы данных",             date: d(0, 9),   status: "available"  },
  { id: "l6",  type: "practice", topic: "Транзакции и блокировки",            discipline: "Базы данных",             date: d(2, 11),  status: "locked"     },
  { id: "l7",  type: "lab",      topic: "Работа с PostgreSQL",                discipline: "Базы данных",             date: d(5, 13),  status: "locked"     },
  { id: "l8",  type: "lecture",  topic: "NoSQL: MongoDB",                     discipline: "Базы данных",             date: d(7, 9),   status: "locked"     },

  { id: "l9",  type: "lecture",  topic: "Производные и их применение",        discipline: "Математический анализ",   date: d(-6, 11), status: "done",      score: 55  },
  { id: "l10", type: "practice", topic: "Интегрирование по частям",           discipline: "Математический анализ",   date: d(-2, 9),  status: "done",      score: 82  },
  { id: "l11", type: "lecture",  topic: "Ряды Фурье",                         discipline: "Математический анализ",   date: d(1, 11),  status: "available"  },
  { id: "l12", type: "practice", topic: "Дифференциальные уравнения",         discipline: "Математический анализ",   date: d(4, 9),   status: "locked"     },
  { id: "l13", type: "lecture",  topic: "Функции комплексного переменного",   discipline: "Математический анализ",   date: d(8, 11),  status: "locked"     },

  { id: "l14", type: "lecture",  topic: "Гражданское право: основы",          discipline: "Правовое регулирование",  date: d(-4, 13), status: "done",      score: 70  },
  { id: "l15", type: "practice", topic: "Составление договоров",              discipline: "Правовое регулирование",  date: d(3, 13),  status: "available"  },
  { id: "l16", type: "lecture",  topic: "Интеллектуальная собственность",     discipline: "Правовое регулирование",  date: d(10, 13), status: "locked"     },
];

const MOCK_DISCIPLINES: MockDiscipline[] = [
  {
    id: "d1", title: "Базы данных", totalLessons: 8, doneLessons: 4,
    lessons: MOCK_LESSONS.filter(l => l.discipline === "Базы данных"),
  },
  {
    id: "d2", title: "Математический анализ", totalLessons: 5, doneLessons: 2,
    lessons: MOCK_LESSONS.filter(l => l.discipline === "Математический анализ"),
  },
  {
    id: "d3", title: "Правовое регулирование в сфере ИТ", totalLessons: 3, doneLessons: 1,
    lessons: MOCK_LESSONS.filter(l => l.discipline === "Правовое регулирование"),
  },
];

const MOCK_CONTEXT = { name: "Информационные технологии", period: "IV курс · Весенний семестр 2026" };

// ── Мок-уведомления ───────────────────────────────────────────────────────────
interface Notification {
  id: string;
  type: "univerkon" | "system";
  title: string;
  body: string;
  date: Date;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "univerkon", title: "Новое занятие доступно", body: "Открылось занятие «Транзакции и блокировки» по дисциплине Базы данных", date: d(0, 8), read: false },
  { id: "n2", type: "univerkon", title: "Оценка выставлена", body: "По дисциплине «Математический анализ» выставлена оценка за тему «Производные»", date: d(-1, 14), read: false },
  { id: "n3", type: "system",    title: "Плановые работы", body: "26 июня с 23:00 до 01:00 будут проводиться технические работы. ЭИОС будет недоступна.", date: d(-2, 10), read: true },
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
export function Trajectory({ studentId: _studentId }: { studentId: StudentId }) {
  const [tab, setTab] = useState<"schedule" | "disciplines">("schedule");
  const [scheduleView, setScheduleView] = useState<"day" | "week">("day");
  const [selectedDay, setSelectedDay] = useState(TODAY);
  const [openDiscipline, setOpenDiscipline] = useState<string | null>(null);
  const [openLesson, setOpenLesson] = useState<MockLesson | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [swUpdate, setSwUpdate] = useState(false);

  useEffect(() => {
    onSwUpdate((s) => setSwUpdate(s === "available"));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (openLesson) {
    return <LessonScreen lesson={openLesson} onBack={() => setOpenLesson(null)} />;
  }

  if (showNotifications) {
    return (
      <NotificationsScreen
        notifications={notifications}
        onBack={() => setShowNotifications(false)}
        onRead={(id) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))}
      />
    );
  }

  const discipline = openDiscipline ? MOCK_DISCIPLINES.find(d => d.id === openDiscipline) : null;
  if (discipline) {
    return (
      <DisciplineScreen
        discipline={discipline}
        onBack={() => setOpenDiscipline(null)}
        onLesson={setOpenLesson}
      />
    );
  }

  return (
    <div style={s.root}>
      <Header unreadCount={unreadCount} onBell={() => setShowNotifications(true)} />
      <div style={s.body}>
        {tab === "schedule" && (
          <ScheduleTab
            view={scheduleView}
            onViewChange={setScheduleView}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            onLesson={setOpenLesson}
          />
        )}
        {tab === "disciplines" && (
          <DisciplinesTab
            onDiscipline={setOpenDiscipline}
            onLesson={setOpenLesson}
          />
        )}
      </div>
      <BottomNav tab={tab} onChange={setTab} />
      <StatusBar swUpdate={swUpdate} />
    </div>
  );
}

// ── Шапка ─────────────────────────────────────────────────────────────────────
function Header({ unreadCount, onBell }: { unreadCount: number; onBell: () => void }) {
  return (
    <header style={s.header}>
      <div style={s.headerLogo}>
        <LogoIcon />
        <span style={s.headerTitle}>ЭИОС</span>
      </div>
      <button style={s.contextBtn}>
        <div style={s.contextName}>{MOCK_CONTEXT.name}</div>
        <div style={s.contextPeriod}>{MOCK_CONTEXT.period}</div>
      </button>
      <button style={s.bellBtn} onClick={onBell}>
        <BellIcon />
        {unreadCount > 0 && <span style={s.bellBadge}>{unreadCount}</span>}
      </button>
      <div style={s.avatar}>АМ</div>
    </header>
  );
}

// ── Статусная строка ──────────────────────────────────────────────────────────
function StatusBar({ swUpdate }: { swUpdate: boolean }) {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0";
  return (
    <div style={s.statusBar}>
      {swUpdate
        ? <button style={s.updateBtn} onClick={applySwUpdate}>↑ Обновить приложение</button>
        : <span />
      }
      <span style={s.versionLabel}>v{version}</span>
    </div>
  );
}

// ── Нижняя навигация ──────────────────────────────────────────────────────────
function BottomNav({ tab, onChange }: { tab: string; onChange: (t: any) => void }) {
  const items = [
    { id: "schedule",    label: "Расписание", icon: <CalIcon /> },
    { id: "disciplines", label: "Дисциплины", icon: <BookIcon /> },
  ];
  return (
    <nav style={s.bottomNav}>
      {items.map(it => (
        <button key={it.id} style={s.navItem} onClick={() => onChange(it.id)}>
          <span style={{ color: tab === it.id ? "#4B9EE5" : "#2A4A6A" }}>{it.icon}</span>
          <span style={{ ...s.navLabel, color: tab === it.id ? "#4B9EE5" : "#2A4A6A" }}>{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── Расписание ────────────────────────────────────────────────────────────────
function ScheduleTab({ view, onViewChange, selectedDay, onDayChange, onLesson }: {
  view: "day" | "week";
  onViewChange: (v: "day" | "week") => void;
  selectedDay: Date;
  onDayChange: (d: Date) => void;
  onLesson: (l: MockLesson) => void;
}) {
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
    ? MOCK_LESSONS.filter(l => sameDay(l.date, selectedDay)).sort((a, b) => a.date.getTime() - b.date.getTime())
    : MOCK_LESSONS.filter(l => weekDays.some(wd => sameDay(l.date, wd))).sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div>
      {/* Тоггл день/неделя */}
      <div style={s.toggle}>
        <button style={{ ...s.toggleBtn, ...(view === "day" ? s.toggleActive : {}) }} onClick={() => onViewChange("day")}>День</button>
        <button style={{ ...s.toggleBtn, ...(view === "week" ? s.toggleActive : {}) }} onClick={() => onViewChange("week")}>Неделя</button>
      </div>

      {/* Горизонтальная полоса дней */}
      <div style={s.dayStrip}>
        {days.map(day => {
          const hasLessons = MOCK_LESSONS.some(l => sameDay(l.date, day));
          const isSelected = sameDay(day, selectedDay);
          const isToday = sameDay(day, TODAY);
          return (
            <button key={day.toISOString()} style={s.dayBtn} onClick={() => { onDayChange(day); onViewChange("day"); }}>
              <span style={{ ...s.dayBtnWd, color: isSelected ? "#4B9EE5" : isToday ? "#C8DEF4" : "#4D7BA8" }}>
                {day.toLocaleDateString("ru", { weekday: "short" })}
              </span>
              <span style={{
                ...s.dayBtnNum,
                background: isSelected ? "#4B9EE5" : "transparent",
                color: isSelected ? "#fff" : isToday ? "#fff" : "#7FA4CC",
              }}>
                {day.getDate()}
              </span>
              {hasLessons && <span style={{ ...s.dayDot, background: isSelected ? "#fff" : "#4B9EE5" }} />}
            </button>
          );
        })}
      </div>

      {/* Заголовок */}
      <div style={s.sectionLabel}>
        {view === "day"
          ? sameDay(selectedDay, TODAY) ? "Сегодня" : formatDay(selectedDay)
          : `${formatDay(weekDays[0])} — ${formatDay(weekDays[6])}`
        }
      </div>

      {/* Карточки занятий */}
      {visibleLessons.length === 0
        ? <div style={s.empty}>Занятий нет</div>
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
        <div style={{ ...s.lessonTopic, color: isLocked ? "#4D7BA8" : "#C8DEF4" }}>{l.topic}</div>
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

// ── Дисциплины ────────────────────────────────────────────────────────────────
function DisciplinesTab({ onDiscipline, onLesson: _onLesson }: {
  onDiscipline: (id: string) => void;
  onLesson: (l: MockLesson) => void;
}) {
  return (
    <div>
      <div style={s.sectionLabel}>Дисциплины семестра</div>
      {MOCK_DISCIPLINES.map(d => (
        <button key={d.id} style={s.disciplineCard} onClick={() => onDiscipline(d.id)}>
          <div style={s.disciplineHead}>
            <span style={s.disciplineTitle}>{d.title}</span>
            {d.grade
              ? <span style={{ ...s.gradeChip, background: "#1A3A1A", color: "#2EA05A" }}>{d.grade}</span>
              : <span style={s.progressChip}>{d.doneLessons}/{d.totalLessons}</span>
            }
          </div>
          <div style={s.disciplineBar}>
            <div style={{ ...s.disciplineFill, width: `${(d.doneLessons / d.totalLessons) * 100}%` }} />
          </div>
        </button>
      ))}
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
    <div style={s.root}>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> Назад
        </button>
        <div style={s.subHeaderTitle}>{discipline.title}</div>
      </div>
      <div style={{ ...s.body, paddingTop: 16 }}>
        <div style={s.sectionLabel}>Все занятия</div>
        {discipline.lessons.map((l, i) => (
          <LessonCard key={l.id} lesson={l} showDate={true} onOpen={() => onLesson(l)} />
        ))}
      </div>
    </div>
  );
}

// ── Экран уведомлений ─────────────────────────────────────────────────────────
function NotificationsScreen({ notifications, onBack, onRead }: {
  notifications: Notification[];
  onBack: () => void;
  onRead: (id: string) => void;
}) {
  return (
    <div style={s.root}>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> Назад
        </button>
        <div style={s.subHeaderTitle}>Уведомления</div>
      </div>
      <div style={{ ...s.body, paddingTop: 16 }}>
        {notifications.length === 0
          ? <div style={s.empty}>Нет уведомлений</div>
          : notifications.map(n => (
            <div
              key={n.id}
              style={{ ...s.notifCard, opacity: n.read ? 0.55 : 1 }}
              onClick={() => onRead(n.id)}
            >
              <div style={s.notifHead}>
                <span style={{ ...s.notifType, color: n.type === "system" ? "#7C5CBF" : "#4B9EE5" }}>
                  {n.type === "system" ? "Система" : "Univerkon"}
                </span>
                <span style={s.notifDate}>{formatDay(n.date)}</span>
                {!n.read && <span style={s.notifDot} />}
              </div>
              <div style={s.notifTitle}>{n.title}</div>
              <div style={s.notifBody}>{n.body}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Экран занятия (заглушка) ──────────────────────────────────────────────────
function LessonScreen({ lesson, onBack }: { lesson: MockLesson; onBack: () => void }) {
  const typeColor = LESSON_TYPE_COLOR[lesson.type];
  return (
    <div style={s.root}>
      <div style={s.subHeader}>
        <button style={s.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> Назад
        </button>
        <div style={s.subHeaderTitle}>{lesson.discipline}</div>
      </div>
      <div style={{ ...s.body, paddingTop: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ ...s.lessonTypeTag, background: hexToRgba(typeColor, 0.15), color: typeColor, marginBottom: 12 }}>
          {LESSON_TYPE_LABEL[lesson.type]}
        </div>
        <div style={{ color: "#C8DEF4", fontSize: "1.05rem", fontWeight: 600, textAlign: "center", marginBottom: 6 }}>
          {lesson.topic}
        </div>
        <div style={{ color: "#4D7BA8", fontSize: "0.8rem", marginBottom: 32 }}>
          {formatDay(lesson.date)} · {formatTime(lesson.date)}
        </div>
        <button style={{ ...s.launchBtn, background: "#4B9EE5" }}>
          ► Открыть занятие
        </button>
        {lesson.score !== undefined && (
          <div style={{ color: "#2EA05A", marginTop: 16, fontSize: "0.85rem" }}>
            Пройдено · {lesson.score}%
          </div>
        )}
      </div>
    </div>
  );
}

// ── Иконки ────────────────────────────────────────────────────────────────────
function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B9EE5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

// ── Стили ─────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  root: { maxWidth: 480, margin: "0 auto", height: "100vh", background: "#091629", display: "flex", flexDirection: "column", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", boxShadow: "0 0 60px rgba(0,0,0,0.7)" },
  header: { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#0A1E3B", borderBottom: "0.5px solid #1A3560", flexShrink: 0 },
  headerLogo: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  headerTitle: { color: "#C8DEF4", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.06em" },
  contextBtn: { flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "2px 8px", minWidth: 0 },
  contextName: { color: "#7FA4CC", fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  contextPeriod: { color: "#4D7BA8", fontSize: "0.62rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  avatar: { width: 30, height: 30, borderRadius: "50%", background: "#1A3560", color: "#4B9EE5", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  body: { flex: 1, padding: "12px 16px 12px", overflowY: "auto" },
  bottomNav: { background: "#0A1E3B", borderTop: "0.5px solid #1A3560", display: "flex", padding: "6px 0 10px", flexShrink: 0 },
  navItem: { flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0" },
  navLabel: { fontSize: "0.62rem", fontWeight: 500 },
  toggle: { display: "flex", background: "#0F2545", borderRadius: 8, padding: 3, marginBottom: 12 },
  toggleBtn: { flex: 1, border: "none", background: "none", color: "#4D7BA8", fontSize: "0.82rem", fontWeight: 500, padding: "6px 0", borderRadius: 6, cursor: "pointer" },
  toggleActive: { background: "#1A3560", color: "#C8DEF4" },
  dayStrip: { display: "flex", gap: 4, overflowX: "auto", marginBottom: 16, paddingBottom: 4 },
  dayBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "0 4px", flexShrink: 0 },
  dayBtnWd: { fontSize: "0.62rem", textTransform: "capitalize" as const },
  dayBtnNum: { width: 28, height: 28, borderRadius: "50%", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 },
  dayDot: { width: 4, height: 4, borderRadius: "50%" },
  sectionLabel: { color: "#4D7BA8", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 10, fontWeight: 600 },
  empty: { color: "#2A4A6A", textAlign: "center" as const, padding: "32px 0", fontSize: "0.85rem" },
  lessonCard: { background: "#0F2545", borderRadius: 10, border: "0.5px solid #1A3560", padding: "12px", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" },
  lessonTypeTag: { borderRadius: 4, padding: "2px 6px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0, marginTop: 2 },
  lessonBody: { flex: 1, minWidth: 0 },
  lessonDate: { color: "#4D7BA8", fontSize: "0.68rem", marginBottom: 2 },
  lessonDiscipline: { color: "#4B9EE5", fontSize: "0.68rem", marginBottom: 3, fontWeight: 500 },
  lessonTopic: { fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.3 },
  lessonScore: { color: "#2EA05A", fontSize: "0.7rem", marginTop: 4 },
  lessonLocked: { color: "#2A4A6A", fontSize: "0.7rem", marginTop: 4 },
  lessonChevron: { color: "#2A4A6A", fontSize: "1.2rem", lineHeight: 1, flexShrink: 0, alignSelf: "center" },
  lessonDoneDot: { width: 6, height: 6, borderRadius: "50%", background: "#2EA05A", flexShrink: 0, marginTop: 4 },
  disciplineCard: { width: "100%", background: "#0F2545", borderRadius: 10, border: "0.5px solid #1A3560", padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left" as const },
  disciplineHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 },
  disciplineTitle: { color: "#C8DEF4", fontSize: "0.88rem", fontWeight: 500 },
  progressChip: { color: "#4D7BA8", fontSize: "0.75rem", flexShrink: 0 },
  gradeChip: { borderRadius: 4, padding: "2px 7px", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 },
  disciplineBar: { height: 2, background: "#152A4A", borderRadius: 1 },
  disciplineFill: { height: "100%", background: "#4B9EE5", borderRadius: 1 },
  subHeader: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#0A1E3B", borderBottom: "0.5px solid #1A3560", flexShrink: 0 },
  backBtn: { background: "none", border: "none", color: "#4B9EE5", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  subHeaderTitle: { color: "#C8DEF4", fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  launchBtn: { width: "100%", maxWidth: 320, border: "none", borderRadius: 10, color: "#fff", fontSize: "0.95rem", fontWeight: 500, padding: "14px 20px", cursor: "pointer" },
  // Колокольчик
  bellBtn: { position: "relative" as const, background: "none", border: "none", cursor: "pointer", color: "#4D7BA8", padding: "2px", display: "flex", flexShrink: 0 },
  bellBadge: { position: "absolute" as const, top: -2, right: -2, background: "#E05555", color: "#fff", fontSize: "0.55rem", fontWeight: 700, width: 14, height: 14, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  // Статусная строка
  statusBar: { height: 24, background: "#060F1E", borderTop: "0.5px solid #0F2030", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", flexShrink: 0 },
  versionLabel: { color: "#1E3A5F", fontSize: "0.6rem", letterSpacing: "0.04em" },
  updateBtn: { background: "none", border: "none", color: "#4B9EE5", fontSize: "0.6rem", cursor: "pointer", padding: 0, fontWeight: 600, letterSpacing: "0.02em" },
  // Уведомления
  notifCard: { background: "#0F2545", borderRadius: 10, border: "0.5px solid #1A3560", padding: "12px 14px", marginBottom: 8, cursor: "pointer" },
  notifHead: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 },
  notifType: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em" },
  notifDate: { color: "#2A4A6A", fontSize: "0.65rem", flex: 1 },
  notifDot: { width: 6, height: 6, borderRadius: "50%", background: "#4B9EE5", flexShrink: 0 },
  notifTitle: { color: "#C8DEF4", fontSize: "0.85rem", fontWeight: 500, marginBottom: 4 },
  notifBody: { color: "#4D7BA8", fontSize: "0.78rem", lineHeight: 1.5 },
};
