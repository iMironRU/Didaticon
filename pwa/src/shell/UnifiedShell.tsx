/**
 * UnifiedShell — единый shell для всех ролей (Block I этап 8).
 *
 * Заменяет StudentView + TeacherView. Различия по ролям сведены к нескольким
 * switch'ам по dispatchRole:
 *  - tabs[] для BottomNav
 *  - source данных (Person, schedule, gradebook, …)
 *  - какие screens доступны на каких route'ах
 *
 * Общее для всех:
 *  - Header / BottomNav / StatusBar chrome
 *  - ProfileTab (учитель тоже видит ЕИВ, размер шрифта, "Мои роли", переключение роли)
 *  - Notifications
 *
 * См. memory: architecture.md правила 1, 4; tech_debt.md Block I этап 8.
 */
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type {
  Person, Learner, UnitLeaf, UnitGroup, CurriculumUnit, TrajectoryLesson,
  ScheduleResponse, ScheduleSlot, GradebookEntry, BookingSlot,
  TeacherScheduleResponse, TeacherScheduleSlot,
} from "@eios/contracts";
import { useRoute, useRouteContext, navigate } from "../router.js";
import { getThemeMode, setTheme, type ThemeMode } from "../theme.js";
import { useLocale } from "../locale.js";
import { onSwUpdate } from "../sw-update.js";
import { Header, ContextSwitcher, ContextLabel } from "./Header.js";
import { BottomNav } from "./BottomNav.js";
import { StatusBar } from "./StatusBar.js";
import { NetworkStatus } from "./NetworkStatus.js";
import { ScheduleScreen } from "../screens/schedule/ScheduleScreen.js";
import { LearnerSlotCard, type LearnerSlotEntry } from "../screens/schedule/LearnerSlotCard.js";
import { TeacherSlotCard } from "../screens/schedule/TeacherSlotCard.js";
import { LearnerLessonScreen } from "../screens/lesson/LearnerLessonScreen.js";
import { TeacherLessonScreen } from "../screens/lesson/TeacherLessonScreen.js";
import { PerformanceTab } from "../screens/performance/PerformanceTab.js";
import { UnitScreen } from "../screens/performance/UnitScreen.js";
import { GroupScreen } from "../screens/performance/GroupScreen.js";
import { GradebookTab } from "../screens/gradebook/GradebookTab.js";
import { ProfileTab } from "../screens/profile/ProfileTab.js";
import { ContextSwitcherScreen } from "../screens/profile/ContextSwitcherScreen.js";
import { NotificationsScreen, NotificationDetailScreen } from "../screens/notifications/NotificationsScreen.js";
import { EStudentScreen } from "../screens/EStudentScreen.js";
import { CalIcon, BookIcon, GradebookIcon, PersonIcon } from "../components/icons/index.js";
import * as source from "../data/source.js";

interface Props {
  role:      "student" | "parent" | "teacher";
  authName:  string;
  lkUrl?:    string;
  onLogout?: () => void;
}

// ── Утилиты ─────────────────────────────────────────────────────────────────

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

function buildScheduleItems(schedule: ScheduleResponse | undefined, lessonMap: Map<string, { lesson: TrajectoryLesson; unitTitle: string }>): LearnerSlotEntry[] {
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

function findTeacherSlotById(schedule: TeacherScheduleResponse, slotId: string): { slot: TeacherScheduleSlot; date: string } | null {
  for (const day of schedule.days) {
    for (const slot of day.slots) {
      if (slot.slotId === slotId) return { slot, date: day.date };
    }
  }
  return null;
}

// ── Главный компонент ───────────────────────────────────────────────────────
export function UnifiedShell({ role, authName, lkUrl, onLogout }: Props) {
  const route = useRoute();
  const urlCtx = useRouteContext();
  const { t, locale, changeLocale } = useLocale();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getThemeMode);
  const [swUpdate, setSwUpdate] = useState(false);
  const [scheduleView, setScheduleView] = useState<"day" | "week">("day");
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(() => today);

  useEffect(() => { onSwUpdate(s => setSwUpdate(s === "available")); }, []);
  function handleThemeChange(mode: ThemeMode) { setTheme(mode); setThemeMode(mode); }

  const isTeacher = role === "teacher";

  // ── Данные по роли ────────────────────────────────────────────────────
  const person: Person = isTeacher
    ? source.getTeacherPerson(authName)
    : source.getPerson(role);
  const allLearners: Learner[] = isTeacher
    ? []
    : (person.personType === "parent" ? (person.children ?? []) : person.learners);

  const [currentLearnerId, setCurrentLearnerId] = useState(() =>
    localStorage.getItem("eios_default_learner") ?? allLearners[0]?.learnerId ?? "");
  const [defaultLearnerId, setDefaultLearnerId] = useState(() =>
    localStorage.getItem("eios_default_learner") ?? allLearners[0]?.learnerId ?? "");

  const learner: Learner | null = isTeacher
    ? null
    : (allLearners.find(l => l.learnerId === currentLearnerId) ?? allLearners[0] ?? null);

  // ── Notifications (только для student/parent) ─────────────────────────
  const notifProp = isTeacher ? null : source.getNotifications();
  const [notifs, setNotifs] = useState(notifProp?.notifications ?? []);
  function markRead(id: string)  { setNotifs(ns => ns.map(n => n.notificationId === id ? { ...n, read: true } : n)); }
  function markAllRead()         { setNotifs(ns => ns.map(n => ({ ...n, read: true }))); }
  const unreadCount = notifs.filter(n => !n.read).length;

  function setDefault(lid: string) { localStorage.setItem("eios_default_learner", lid); setDefaultLearnerId(lid); }
  function switchLearner(lid: string) { setCurrentLearnerId(lid); navigate({ name: "schedule" }); }

  const initials = (person.lastName[0] ?? "") + (person.firstName[0] ?? "");

  // ── Дальше — switch по роли для основных экранов ──────────────────────
  // Учитель / Студент-родитель ветвятся в render-блоках ниже.

  // ── Lesson (разные для учителя и студента) ────────────────────────────
  if (route.name === "lesson") {
    if (isTeacher) {
      const tSchedule = source.getTeacherSchedule();
      const attendance = source.getAttendance();
      const found = findTeacherSlotById(tSchedule, route.id);
      if (found) {
        const att = attendance[found.slot.slotId]?.students ?? [];
        return (
          <Frame swUpdate={swUpdate} eiv={person.eiv}>
            <TeacherLessonScreen slot={found.slot} date={found.date} students={att} onBack={() => history.back()} />
          </Frame>
        );
      }
    } else {
      const scheduleMap = source.getScheduleMap();
      const schedule  = scheduleMap.get(learner?.learnerId ?? "");
      const lessonMap = collectLessons(learner?.units ?? []);
      const entry     = lessonMap.get(route.id);
      const slotInfo  = findSlotByLessonId(schedule, route.id);
      if (entry) {
        return (
          <Frame swUpdate={swUpdate} eiv={person.eiv}>
            <LearnerLessonScreen
              lesson={entry.lesson}
              slot={slotInfo?.slot ?? null}
              slotDate={slotInfo?.date ?? null}
              unitTitle={entry.unitTitle}
              onBack={() => history.back()}
              onLaunch={() => entry.lesson.packageUrl && window.open(entry.lesson.packageUrl)}
              readOnly={role === "parent"}
            />
          </Frame>
        );
      }
    }
  }

  // ── e-Student — только для студентов (parent видит контексты детей,
  //   но карту выпускает Univerkon на конкретного физика) ─────────────────
  if (!isTeacher && role === "student" && route.name === "estudent" && urlCtx) {
    return (
      <Frame swUpdate={swUpdate} eiv={person.eiv}>
        <EStudentScreen contextId={urlCtx.contextId} onBack={() => history.back()} />
      </Frame>
    );
  }

  // ── Unit / Group / Contexts / Notifications — только для студентов/родителей ─
  if (!isTeacher) {
    if (route.name === "unit") {
      const unit = findUnitById(learner?.units ?? [], route.id);
      if (unit) {
        return (
          <Frame swUpdate={swUpdate} eiv={person.eiv}>
            <UnitScreen unit={unit} onBack={() => history.back()}
              onLesson={lesson => navigate({ name: "lesson", id: lesson.lessonId })} />
          </Frame>
        );
      }
    }
    if (route.name === "group") {
      const group = findGroupById(learner?.units ?? [], route.id);
      if (group) {
        return (
          <Frame swUpdate={swUpdate} eiv={person.eiv}>
            <GroupScreen group={group} onBack={() => history.back()}
              onUnit={unit => navigate({ name: "unit", id: unit.unitId })} />
          </Frame>
        );
      }
    }
    if (route.name === "contexts") {
      return (
        <Frame swUpdate={swUpdate} eiv={person.eiv}>
          <Header
            initials={initials}
            onAvatarTap={() => navigate({ name: "profile" })}
            bell={{ unreadCount, onTap: () => navigate({ name: "notifications" }) }}
            middle={<ContextLabel text={person.personType === "parent" ? t("myChildren") : t("learnersTitle")} />}
          />
          <ContextSwitcherScreen
            person={person}
            learners={allLearners}
            currentId={currentLearnerId}
            defaultId={defaultLearnerId}
            onSelect={switchLearner}
            onSetDefault={setDefault}
          />
        </Frame>
      );
    }
    if (route.name === "notification") {
      const n = notifs.find(n => n.notificationId === route.id);
      if (n) {
        return (
          <Frame swUpdate={swUpdate} eiv={person.eiv}>
            <NotificationDetailScreen notification={n} onBack={() => history.back()} />
          </Frame>
        );
      }
    }
    if (route.name === "notifications") {
      return (
        <Frame swUpdate={swUpdate} eiv={person.eiv}>
          <NotificationsScreen
            notifications={notifs}
            onBack={() => history.back()}
            onOpen={n => { markRead(n.notificationId); navigate({ name: "notification", id: n.notificationId }); }}
            onRead={markRead}
            onReadAll={markAllRead}
          />
        </Frame>
      );
    }
  }

  // ── Основной шаблон с табами ──────────────────────────────────────────
  const tab = isTeacher
    ? (route.name === "tasks" || route.name === "profile" ? route.name : "schedule")
    : (route.name === "performance" ? "performance"
       : route.name === "gradebook" ? "gradebook"
       : route.name === "profile"   ? "profile"
       : "schedule");

  // Schedule data — разное по роли
  let scheduleNode: React.ReactNode = null;
  if (tab === "schedule") {
    if (isTeacher) {
      const tSchedule = source.getTeacherSchedule();
      const tEntries = tSchedule.days.flatMap(d => d.slots.map(slot => ({ date: d.date, slot })));
      const fromDate = tSchedule.days[0]?.date ?? today;
      const toDate   = tSchedule.days[tSchedule.days.length - 1]?.date ?? today;
      scheduleNode = (
        <ScheduleScreen
          entries={tEntries}
          fromDate={fromDate}
          toDate={toDate}
          today={today}
          view={scheduleView}
          onViewChange={setScheduleView}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          emptyText="Занятий нет"
          renderSlot={(entry) => (
            <TeacherSlotCard
              key={entry.slot.slotId}
              slot={entry.slot}
              date={entry.date}
              onOpen={() => navigate({ name: "lesson", id: entry.slot.slotId })}
            />
          )}
        />
      );
    } else if (learner) {
      const scheduleMap = source.getScheduleMap();
      const schedule  = scheduleMap.get(learner.learnerId);
      const lessonMap = collectLessons(learner.units);
      const schedItems = buildScheduleItems(schedule, lessonMap);
      scheduleNode = (
        <ScheduleScreen
          entries={schedItems}
          fromDate={schedule?.from ?? today}
          toDate={schedule?.to ?? today}
          today={today}
          view={scheduleView}
          onViewChange={setScheduleView}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          emptyText={t("noLessons")}
          renderSlot={(entry, showDate) => (
            <LearnerSlotCard
              key={entry.slot.slotId}
              entry={entry}
              today={today}
              showDate={showDate}
              onOpen={() => navigate({ name: "lesson", id: entry.slot.slotId })}
            />
          )}
        />
      );
    }
  }

  // Performance / Gradebook (только студент/родитель)
  const gradebookMap = isTeacher ? null : source.getGradebookMap();
  const gradebook = learner ? gradebookMap?.get(learner.learnerId) : undefined;
  const debtCount = gradebook
    ? gradebook.semesters.flatMap(s => s.entries).filter(
        e => e.finalControl.state === "failed_retake_pending" || e.finalControl.state === "failed_retake_scheduled"
      ).length
    : 0;

  // Tabs config
  const tabs = isTeacher
    ? [
        { id: "schedule" as const, label: "Расписание", icon: <CalIcon /> },
        { id: "tasks"    as const, label: "Задания",    icon: <span style={{ fontSize: 20 }}>📋</span> },
        { id: "profile"  as const, label: "Профиль",    icon: <PersonIcon /> },
      ]
    : [
        { id: "schedule" as const,    label: t("schedule"),    icon: <CalIcon /> },
        { id: "performance" as const, label: t("disciplines"), icon: <BookIcon /> },
        { id: "gradebook" as const,   label: t("gradebook"),   icon: <GradebookIcon />, badge: debtCount },
        { id: "profile" as const,     label: t("profile"),     icon: <PersonIcon /> },
      ];

  // Header middle — для учителя метка "Педагог", для остальных context-switcher
  const middle = isTeacher
    ? <ContextLabel text="Педагог" />
    : (learner ? (
        <ContextSwitcher
          programType={learner.programType}
          group={learner.group}
          periodLabel={learner.periodLabel}
          onTap={allLearners.length > 1 ? () => navigate({ name: "contexts" }) : undefined}
        />
      ) : <ContextLabel text="—" />);

  return (
    <Frame swUpdate={swUpdate} eiv={person.eiv}>
      <Header
        initials={initials}
        onAvatarTap={() => navigate({ name: "profile" })}
        bell={isTeacher ? undefined : { unreadCount, onTap: () => navigate({ name: "notifications" }) }}
        middle={middle}
      />
      <div style={st.body}>
        {tab === "schedule" && (
          <div className={isTeacher ? "px-4 py-2.5" : ""}>{scheduleNode}</div>
        )}
        {!isTeacher && tab === "performance" && learner && (
          <PerformanceTab
            learner={learner}
            onUnit={u  => navigate({ name: "unit",  id: u.unitId  })}
            onGroup={g => navigate({ name: "group", id: g.unitId })}
          />
        )}
        {!isTeacher && tab === "gradebook" && gradebook && (
          <GradebookTab
            gradebook={gradebook}
            onBookRetake={(entry: GradebookEntry, slot: BookingSlot) => {
              console.log("book retake", entry.unitId, slot.bookingSlotId);
            }}
          />
        )}
        {isTeacher && tab === "tasks" && (
          <div style={st.stub}>
            <div style={st.stubIcon}>📋</div>
            <div style={st.stubTitle}>Очередь заданий</div>
            <div style={st.stubSub}>Здесь будут задания студентов на проверку от Тестикона</div>
          </div>
        )}
        {tab === "profile" && (
          <ProfileTab
            person={person}
            learner={learner}
            themeMode={themeMode}
            onThemeChange={handleThemeChange}
            locale={locale}
            onLocaleChange={changeLocale}
            lkUrl={lkUrl}
            onSwitchContext={!isTeacher && allLearners.length > 1 ? () => navigate({ name: "contexts" }) : undefined}
            onLogout={onLogout}
          />
        )}
      </div>
      <BottomNav
        activeId={tab}
        onTap={(id) => navigate({ name: id as "schedule" | "performance" | "gradebook" | "tasks" | "profile" })}
        tabs={tabs}
      />
    </Frame>
  );
}

// ── Frame — обёртка корня + StatusBar для всех веток ────────────────────
function Frame({ swUpdate, eiv, children }: { swUpdate: boolean; eiv: string; children: React.ReactNode }) {
  return (
    <div style={st.root}>
      <NetworkStatus />
      {children}
      <StatusBar swUpdate={swUpdate} eiv={eiv} />
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  root:      { display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "var(--c-bg)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  body:      { flex: 1, overflowY: "auto", padding: "0" },
  stub:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 32 },
  stubIcon:  { fontSize: 48 },
  stubTitle: { fontSize: "1rem", fontWeight: 600, color: "var(--c-text-primary)" },
  stubSub:   { fontSize: "0.82rem", color: "var(--c-text-muted)", textAlign: "center" as const, lineHeight: 1.5 },
};
