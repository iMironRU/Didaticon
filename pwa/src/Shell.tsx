import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type {
  Person, Learner, UnitLeaf, UnitGroup, CurriculumUnit, TrajectoryLesson,
  Notification,
} from "@eios/contracts";
import type { ScheduleResponse, ScheduleSlot } from "@eios/contracts";
import type { GradebookResponse, GradebookEntry, BookingSlot } from "@eios/contracts";
import type { NotificationsResponse } from "@eios/contracts";
import { useRoute, navigate } from "./router.js";
import { getThemeMode, setTheme, type ThemeMode } from "./theme.js";
import { onSwUpdate, applySwUpdate } from "./sw-update.js";
import type { ScheduleItem } from "./screens/schedule/ScheduleTab.js";
import { ScheduleTab } from "./screens/schedule/ScheduleTab.js";
import { LessonScreen } from "./screens/lesson/LessonScreen.js";
import { PerformanceTab } from "./screens/performance/PerformanceTab.js";
import { UnitScreen } from "./screens/performance/UnitScreen.js";
import { GroupScreen } from "./screens/performance/GroupScreen.js";
import { GradebookTab } from "./screens/gradebook/GradebookTab.js";
import { ProfileTab } from "./screens/profile/ProfileTab.js";
import { ContextSwitcherScreen } from "./screens/profile/ContextSwitcherScreen.js";
import { NotificationsScreen, NotificationDetailScreen } from "./screens/notifications/NotificationsScreen.js";
import { LogoIcon, BellIcon, CalIcon, BookIcon, GradebookIcon, PersonIcon, SwitchIcon } from "./components/icons/index.js";

interface Props {
  person:        Person;
  scheduleMap:   Map<string, ScheduleResponse>;    // learnerId → ScheduleResponse
  gradebookMap:  Map<string, GradebookResponse>;   // learnerId → GradebookResponse
  notifications: NotificationsResponse;
  lkUrl?:        string;
  onLogout?:     () => void;
}

// ── Утилиты ───────────────────────────────────────────────────────────────────

function collectLessons(units: CurriculumUnit[]): Map<string, { lesson: TrajectoryLesson; unitTitle: string }> {
  const map = new Map<string, { lesson: TrajectoryLesson; unitTitle: string }>();
  for (const u of units) {
    if (u.kind === "unit") {
      for (const l of u.lessons) map.set(l.lessonId, { lesson: l, unitTitle: u.title });
    } else {
      for (const child of u.children) {
        for (const l of child.lessons) map.set(l.lessonId, { lesson: l, unitTitle: child.title });
      }
    }
  }
  return map;
}

function buildScheduleItems(schedule: ScheduleResponse | undefined, lessonMap: Map<string, { lesson: TrajectoryLesson; unitTitle: string }>): ScheduleItem[] {
  if (!schedule) return [];
  return schedule.days.flatMap(day =>
    day.slots.map(slot => ({
      date:   day.date,
      slot,
      lesson: lessonMap.get(slot.slotId)?.lesson ?? null,
    })),
  );
}

function findSlotByLessonId(schedule: ScheduleResponse | undefined, lessonId: string): { slot: ScheduleSlot; date: string } | null {
  if (!schedule) return null;
  for (const day of schedule.days) {
    for (const slot of day.slots) {
      if (slot.slotId === lessonId) return { slot, date: day.date };
    }
  }
  return null;
}

function findUnitById(units: CurriculumUnit[], id: string): UnitLeaf | null {
  for (const u of units) {
    if (u.kind === "unit" && u.unitId === id) return u;
    if (u.kind === "group") {
      for (const c of u.children) { if (c.unitId === id) return c; }
    }
  }
  return null;
}

function findGroupById(units: CurriculumUnit[], id: string): UnitGroup | null {
  for (const u of units) {
    if (u.kind === "group" && u.unitId === id) return u;
  }
  return null;
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export function Shell({ person, scheduleMap, gradebookMap, notifications: notifProp, lkUrl, onLogout }: Props) {
  const route = useRoute();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getThemeMode);
  const [locale, setLocale]       = useState<"ru" | "en">("ru");
  const [scheduleView, setScheduleView] = useState<"day" | "week">("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currentLearnerId, setCurrentLearnerId] = useState(() =>
    localStorage.getItem("eios_default_learner") ?? person.learners[0]?.learnerId ?? "");
  const [defaultLearnerId, setDefaultLearnerId] = useState(() =>
    localStorage.getItem("eios_default_learner") ?? person.learners[0]?.learnerId ?? "");
  const [notifs, setNotifs] = useState(notifProp.notifications);
  const [swUpdate, setSwUpdate] = useState(false);

  useEffect(() => { onSwUpdate(s => setSwUpdate(s === "available")); }, []);

  function handleThemeChange(mode: ThemeMode) { setTheme(mode); setThemeMode(mode); }
  function markRead(id: string)  { setNotifs(ns => ns.map(n => n.notificationId === id ? { ...n, read: true } : n)); }
  function markAllRead()         { setNotifs(ns => ns.map(n => ({ ...n, read: true }))); }
  function setDefault(lid: string) { localStorage.setItem("eios_default_learner", lid); setDefaultLearnerId(lid); }
  function switchLearner(lid: string) { setCurrentLearnerId(lid); navigate({ name: "schedule" }); }

  const learner: Learner = person.learners.find(l => l.learnerId === currentLearnerId) ?? person.learners[0];
  const schedule  = scheduleMap.get(learner?.learnerId ?? "");
  const gradebook = gradebookMap.get(learner?.learnerId ?? "");
  const lessonMap = collectLessons(learner?.units ?? []);
  const schedItems = buildScheduleItems(schedule, lessonMap);
  const unreadCount = notifs.filter(n => !n.read).length;
  const today = new Date().toISOString().slice(0, 10);

  const tab = route.name === "performance" ? "performance"
            : route.name === "gradebook"   ? "gradebook"
            : route.name === "profile"     ? "profile"
            : "schedule";

  // ── Рендеринг ──
  let inner: React.ReactNode;

  // Урок
  if (route.name === "lesson") {
    const entry     = lessonMap.get(route.id);
    const slotInfo  = findSlotByLessonId(schedule, route.id);
    if (entry) {
      inner = (
        <LessonScreen
          lesson={entry.lesson}
          slot={slotInfo?.slot ?? null}
          slotDate={slotInfo?.date ?? null}
          unitTitle={entry.unitTitle}
          onBack={() => history.back()}
          onLaunch={() => entry.lesson.packageUrl && window.open(entry.lesson.packageUrl)}
        />
      );
    }
  }

  // Дисциплина / МДК
  else if (route.name === "unit") {
    const unit = findUnitById(learner?.units ?? [], route.id);
    if (unit) {
      inner = (
        <UnitScreen
          unit={unit}
          onBack={() => history.back()}
          onLesson={lesson => navigate({ name: "lesson", id: lesson.lessonId })}
        />
      );
    }
  }

  // ПМ
  else if (route.name === "group") {
    const group = findGroupById(learner?.units ?? [], route.id);
    if (group) {
      inner = (
        <GroupScreen
          group={group}
          onBack={() => history.back()}
          onUnit={unit => navigate({ name: "unit", id: unit.unitId })}
        />
      );
    }
  }

  // Переключатель контекста
  else if (route.name === "contexts") {
    inner = (
      <>
        <Header person={person} learner={learner} unreadCount={unreadCount}
          onBell={() => navigate({ name: "notifications" })}
          onContextTap={() => history.back()}
          contextLabel="Профили обучения"
        />
        <ContextSwitcherScreen
          person={person}
          currentId={currentLearnerId}
          defaultId={defaultLearnerId}
          onSelect={switchLearner}
          onSetDefault={setDefault}
        />
      </>
    );
  }

  // Уведомления — детальный экран
  else if (route.name === "notification") {
    const n = notifs.find(n => n.notificationId === route.id);
    if (n) inner = <NotificationDetailScreen notification={n} onBack={() => history.back()} />;
  }

  // Уведомления — список
  else if (route.name === "notifications") {
    inner = (
      <NotificationsScreen
        notifications={notifs}
        onBack={() => history.back()}
        onOpen={n => { markRead(n.notificationId); navigate({ name: "notification", id: n.notificationId }); }}
        onRead={markRead}
        onReadAll={markAllRead}
      />
    );
  }

  // Основной шаблон с вкладками
  else {
    inner = (
      <>
        <Header
          person={person}
          learner={learner}
          unreadCount={unreadCount}
          onBell={() => navigate({ name: "notifications" })}
          onContextTap={person.learners.length > 1 ? () => navigate({ name: "contexts" }) : undefined}
        />
        <div style={st.body}>
          {tab === "schedule" && (
            <ScheduleTab
              items={schedItems}
              fromDate={schedule?.from ?? today}
              toDate={schedule?.to   ?? today}
              today={today}
              view={scheduleView}
              onViewChange={setScheduleView}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onItem={item => navigate({ name: "lesson", id: item.slot.slotId })}
            />
          )}
          {tab === "performance" && learner && (
            <PerformanceTab
              learner={learner}
              onUnit={u  => navigate({ name: "unit",  id: u.unitId  })}
              onGroup={g => navigate({ name: "group", id: g.unitId })}
            />
          )}
          {tab === "gradebook" && gradebook && (
            <GradebookTab
              gradebook={gradebook}
              onBookRetake={(entry: GradebookEntry, slot: BookingSlot) => {
                console.log("book retake", entry.unitId, slot.bookingSlotId);
              }}
            />
          )}
          {tab === "profile" && learner && (
            <ProfileTab
              person={person}
              learner={learner}
              themeMode={themeMode}
              onThemeChange={handleThemeChange}
              locale={locale}
              onLocaleChange={setLocale}
              lkUrl={lkUrl}
              onSwitchContext={person.learners.length > 1 ? () => navigate({ name: "contexts" }) : undefined}
              onLogout={onLogout}
            />
          )}
        </div>
        <BottomNav tab={tab} />
      </>
    );
  }

  return (
    <div style={st.root}>
      {inner}
      <StatusBar swUpdate={swUpdate} eiv={person.eiv} />
    </div>
  );
}

// ── Шапка ─────────────────────────────────────────────────────────────────────
function Header({ person, learner, unreadCount, onBell, onContextTap, contextLabel }: {
  person:        Person;
  learner:       Learner;
  unreadCount:   number;
  onBell:        () => void;
  onContextTap?: () => void;
  contextLabel?: string;
}) {
  const initials = (person.lastName[0] ?? "") + (person.firstName[0] ?? "");
  return (
    <header style={st.header}>
      <div style={st.headerLogo}>
        <LogoIcon />
        <span style={st.headerTitle}>ЭИОС</span>
      </div>
      {contextLabel
        ? <div style={{ ...st.contextBtn, cursor: "default" as CSSProperties["cursor"] }}>
            <span style={st.contextName}>{contextLabel}</span>
          </div>
        : onContextTap
          ? <button style={st.contextBtn} onClick={onContextTap}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <div style={{ minWidth: 0, overflow: "hidden", textAlign: "left" as const }}>
                  <div style={st.contextName}>{learner.programType} · {learner.group}</div>
                  <div style={st.contextPeriod}>{learner.periodLabel}</div>
                </div>
                <SwitchIcon />
              </div>
            </button>
          : <div style={st.contextBtn}>
              <div style={st.contextName}>{learner.programType} · {learner.group}</div>
              <div style={st.contextPeriod}>{learner.periodLabel}</div>
            </div>
      }
      <button style={st.bellBtn} onClick={onBell}>
        <BellIcon />
        {unreadCount > 0 && <span style={st.bellBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      <div style={st.avatar}>{initials}</div>
    </header>
  );
}

// ── Нижняя навигация ──────────────────────────────────────────────────────────
type TabId = "schedule" | "performance" | "gradebook" | "profile";

function BottomNav({ tab }: { tab: TabId }) {
  const items: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "schedule",    label: "Расписание",  icon: <CalIcon /> },
    { id: "performance", label: "Дисциплины",  icon: <BookIcon /> },
    { id: "gradebook",   label: "Зачётка",     icon: <GradebookIcon /> },
    { id: "profile",     label: "Профиль",     icon: <PersonIcon /> },
  ];
  return (
    <nav style={st.bottomNav}>
      {items.map(it => {
        const active = tab === it.id;
        return (
          <button key={it.id} style={st.navItem}
            onClick={() => navigate({ name: it.id })}>
            <span style={{ color: active ? "var(--c-accent)" : "var(--c-text-dim)" }}>{it.icon}</span>
            <span style={{ ...st.navLabel, color: active ? "var(--c-accent)" : "var(--c-text-dim)" }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Статусная строка ──────────────────────────────────────────────────────────
function StatusBar({ swUpdate, eiv }: { swUpdate: boolean; eiv: string }) {
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0";
  const commit  = typeof __COMMIT_HASH__  !== "undefined" ? __COMMIT_HASH__  : "";
  const [copied, setCopied] = useState(false);

  function copySupportInfo() {
    const screen = window.location.hash || "#/";
    const parts  = [`ЭИОС v${version}`, commit, `ЕИВ ${eiv}`, screen].filter(Boolean);
    navigator.clipboard.writeText(parts.join(" · ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={st.statusBar}>
      <div>
        {swUpdate && (
          <button style={st.updateBtn} onClick={applySwUpdate}>Обновить приложение</button>
        )}
      </div>
      <button style={st.versionBtn} onClick={copySupportInfo} title="Скопировать для поддержки">
        {copied
          ? <span style={{ color: "var(--c-success)" }}>✓ Скопировано</span>
          : <span style={st.versionLabel}>v{version}{commit ? ` · ${commit}` : ""}</span>
        }
      </button>
    </div>
  );
}

// ── Стили ─────────────────────────────────────────────────────────────────────
const st: Record<string, CSSProperties> = {
  root:         { display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "var(--c-bg)" },
  body:         { flex: 1, overflowY: "auto", padding: "12px 16px" },
  header:       { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--c-header)", borderBottom: "0.5px solid var(--c-border)", flexShrink: 0 },
  headerLogo:   { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  headerTitle:  { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 700 },
  contextBtn:   { flex: 1, minWidth: 0, background: "none", border: "none", padding: "4px 8px", borderRadius: 8, cursor: "pointer" },
  contextName:  { color: "var(--c-text-primary)", fontSize: "0.75rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, display: "block" },
  contextPeriod:{ color: "var(--c-text-muted)", fontSize: "0.62rem", whiteSpace: "nowrap" as const, display: "block" },
  bellBtn:      { position: "relative" as const, background: "none", border: "none", cursor: "pointer", color: "var(--c-text-secondary)", padding: 4, flexShrink: 0 },
  bellBadge:    { position: "absolute" as const, top: 0, right: 0, background: "var(--c-danger)", color: "#fff", borderRadius: "50%", fontSize: "0.55rem", fontWeight: 700, minWidth: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" },
  avatar:       { width: 28, height: 28, borderRadius: "50%", background: "var(--c-accent)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bottomNav:    { background: "var(--c-header)", borderTop: "0.5px solid var(--c-border)", display: "flex", padding: "6px 0 10px", flexShrink: 0 },
  navItem:      { flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3, padding: "4px 0" },
  navLabel:     { fontSize: "0.62rem", fontWeight: 500 },
  statusBar:    { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px", background: "var(--c-header)", borderTop: "0.5px solid var(--c-border)", flexShrink: 0 },
  versionBtn:   { background: "none", border: "none", cursor: "pointer", padding: 0 },
  versionLabel: { color: "var(--c-text-dim)", fontSize: "0.62rem" },
  updateBtn:    { border: "none", background: "var(--c-accent)", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: "0.72rem", cursor: "pointer" },
};

// type augmentation для Vite define
declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__:  string;
