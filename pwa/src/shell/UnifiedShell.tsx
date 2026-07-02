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
import { LeftRail } from "./LeftRail.js";
import { StatusBar } from "./StatusBar.js";
import { NetworkStatus } from "./NetworkStatus.js";
import { SkipLink } from "./SkipLink.js";
import { RouteAnnouncer } from "./RouteAnnouncer.js";
import { useDocumentTitle } from "../useDocumentTitle.js";
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
import { TodayScreen } from "../screens/today/TodayScreen.js";
import { CalIcon, BookIcon, GradebookIcon, PersonIcon, TodayIcon, TasksIcon } from "../components/icons/index.js";
import * as source from "../data/source.js";

interface Props {
  role:         "student" | "parent" | "teacher";
  /** Block I v1.1: kind активного teacher-контекста. Undefined для student/parent. */
  teacherKind?: "instructor" | "senior_grader" | "curator";
  authName:     string;
  lkUrl?:       string;
  onLogout?:    () => void;
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
export function UnifiedShell({ role, teacherKind, authName, lkUrl, onLogout }: Props) {
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

  // ── tab/tabs/middle/renderScreen — подняты сюда (были ниже, вычислялись
  // только для финального switch по табам), потому что детальные экраны
  // (lesson/unit/group/notification/estudent/contexts) теперь ТОЖЕ рендерят
  // полный chrome — Header + LeftRail/BottomNav, не только "‹ Назад" внутри
  // экрана (найдено 2026-07-02: без этого некуда прыгнуть на другую вкладку,
  // не выходя назад). Детальные route'ы не входят в switch ниже, поэтому
  // естественно попадают в дефолт "schedule" — активный таб в нав-панели.
  const tab = isTeacher
    ? (route.name === "today" || route.name === "tasks" || route.name === "profile" ? route.name : "schedule")
    : (route.name === "today"       ? "today"
       : route.name === "performance" ? "performance"
       : route.name === "gradebook" ? "gradebook"
       : route.name === "profile"   ? "profile"
       : "schedule");

  const gradebookMap = isTeacher ? null : source.getGradebookMap();
  const gradebook = learner ? gradebookMap?.get(learner.learnerId) : undefined;
  const debtCount = gradebook
    ? gradebook.semesters.flatMap(s => s.entries).filter(
        e => e.finalControl.state === "failed_retake_pending" || e.finalControl.state === "failed_retake_scheduled"
      ).length
    : 0;

  const tabs = isTeacher
    ? [
        { id: "today"    as const, label: "Сегодня",    icon: <TodayIcon /> },
        { id: "schedule" as const, label: "Расписание", icon: <CalIcon /> },
        { id: "tasks"    as const, label: "Задания",    icon: <TasksIcon /> },
        { id: "profile"  as const, label: "Профиль",    icon: <PersonIcon /> },
      ]
    : [
        { id: "today"       as const, label: "Сегодня",        icon: <TodayIcon /> },
        { id: "schedule"    as const, label: t("schedule"),     icon: <CalIcon /> },
        { id: "performance" as const, label: t("disciplines"),  icon: <BookIcon /> },
        { id: "gradebook"   as const, label: t("gradebook"),    icon: <GradebookIcon />, badge: debtCount },
        { id: "profile"     as const, label: t("profile"),      icon: <PersonIcon /> },
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

  /** Общая обёртка chrome — Header + LeftRail/BottomNav + main — для ЛЮБОГО
   *  экрана: и вкладок, и детальных (lesson/unit/group/...). */
  function renderScreen(screenTitle: string, content: React.ReactNode) {
    return (
      <Frame swUpdate={swUpdate} screenTitle={screenTitle}>
        <Header
          initials={initials}
          onAvatarTap={() => navigate({ name: "profile" })}
          bell={isTeacher ? undefined : { unreadCount, onTap: () => navigate({ name: "notifications" }) }}
          middle={middle}
        />
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          <LeftRail
            activeId={tab}
            onTap={(id) => navigate({ name: id as "today" | "schedule" | "performance" | "gradebook" | "tasks" | "profile" })}
            tabs={tabs}
          />
          <main
            id="main-content"
            style={st.body}
            className={`md:mx-auto md:w-full md:pt-8 ${tab === "today" ? "md:max-w-5xl" : "md:max-w-2xl"}`}
            aria-labelledby="page-h1"
          >
            {/* sr-only h1 — каждый экран должен иметь один. Скринридер объявляет
                при переходе по табам. Визуально не нужен (есть BottomNav / LeftRail). */}
            <h1 id="page-h1" className="sr-only">{screenTitle}</h1>
            {content}
          </main>
        </div>
        <BottomNav
          activeId={tab}
          onTap={(id) => navigate({ name: id as "today" | "schedule" | "performance" | "gradebook" | "tasks" | "profile" })}
          tabs={tabs}
        />
      </Frame>
    );
  }

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
        const title = `Занятие · ${found.slot.unitRef.title}`;
        return renderScreen(title,
          <TeacherLessonScreen slot={found.slot} date={found.date} students={att} onBack={() => history.back()} />,
        );
      }
    } else {
      const scheduleMap = source.getScheduleMap();
      const schedule  = scheduleMap.get(learner?.learnerId ?? "");
      const lessonMap = collectLessons(learner?.units ?? []);
      const entry     = lessonMap.get(route.id);
      const slotInfo  = findSlotByLessonId(schedule, route.id);
      if (entry) {
        const title = `Занятие · ${entry.unitTitle}`;
        return renderScreen(title, (
          <LearnerLessonScreen
            lesson={entry.lesson}
            slot={slotInfo?.slot ?? null}
            slotDate={slotInfo?.date ?? null}
            unitTitle={entry.unitTitle}
            onBack={() => history.back()}
            onLaunch={() => entry.lesson.packageUrl && window.open(entry.lesson.packageUrl)}
            readOnly={role === "parent"}
          />
        ));
      }
    }
  }

  // ── e-Student — только для студентов (parent видит контексты детей,
  //   но карту выпускает Univerkon на конкретного физика) ─────────────────
  if (!isTeacher && role === "student" && route.name === "estudent" && urlCtx) {
    return renderScreen("Студенческий билет",
      <EStudentScreen contextId={urlCtx.contextId} onBack={() => history.back()} />,
    );
  }

  // ── Unit / Group / Contexts / Notifications — только для студентов/родителей ─
  if (!isTeacher) {
    if (route.name === "unit") {
      const unit = findUnitById(learner?.units ?? [], route.id);
      if (unit) {
        const title = `Дисциплина · ${unit.title}`;
        return renderScreen(title, (
          <UnitScreen unit={unit} onBack={() => history.back()}
            onLesson={lesson => navigate({ name: "lesson", id: lesson.lessonId })} />
        ));
      }
    }
    if (route.name === "group") {
      const group = findGroupById(learner?.units ?? [], route.id);
      if (group) {
        const title = `ПМ · ${group.title}`;
        return renderScreen(title, (
          <GroupScreen group={group} onBack={() => history.back()}
            onUnit={unit => navigate({ name: "unit", id: unit.unitId })} />
        ));
      }
    }
    if (route.name === "contexts") {
      const title = person.personType === "parent" ? "Мои дети" : "Мои профили обучения";
      return renderScreen(title, (
        <ContextSwitcherScreen
          person={person}
          learners={allLearners}
          currentId={currentLearnerId}
          defaultId={defaultLearnerId}
          onSelect={switchLearner}
          onSetDefault={setDefault}
        />
      ));
    }
    if (route.name === "notification") {
      const n = notifs.find(n => n.notificationId === route.id);
      if (n) {
        const title = `Уведомление · ${n.title}`;
        return renderScreen(title, <NotificationDetailScreen notification={n} onBack={() => history.back()} />);
      }
    }
    if (route.name === "notifications") {
      return renderScreen("Уведомления", (
        <NotificationsScreen
          notifications={notifs}
          onBack={() => history.back()}
          onOpen={n => { markRead(n.notificationId); navigate({ name: "notification", id: n.notificationId }); }}
          onRead={markRead}
          onReadAll={markAllRead}
        />
      ));
    }
  }

  // ── Основной шаблон с табами ──────────────────────────────────────────

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

  return renderScreen(tabHeading(tab, isTeacher), (
    <>
      {tab === "today" && (() => {
        const defaultCtx = isTeacher
          ? (teacherKind === "curator" ? "tch:demo-curator" : teacherKind === "senior_grader" ? "tch:demo-sg" : "tch:demo-1")
          : role === "parent" ? "par:demo-child1"
          : "stu:demo-1";
        return <TodayScreen contextId={urlCtx?.contextId ?? defaultCtx} />;
      })()}
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
          <div style={st.stubIcon} aria-hidden="true"><TasksIcon /></div>
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
    </>
  ));
}

// ── Frame — обёртка корня + StatusBar для всех веток ────────────────────
/**
 * Frame — корневой layout. Содержит общий chrome (skip-link, network-status,
 * route-announcer, status-bar) + единый landmark `<main id="main-content">`.
 *
 * SPA focus management (a11y §5.3):
 *  - `useDocumentTitle(screenTitle)` обновляет вкладку браузера + первичный
 *    источник для AT
 *  - `<RouteAnnouncer>` объявляет смену экрана через aria-live
 */
interface FrameProps {
  swUpdate:    boolean;
  /** Заголовок экрана — для document.title + RouteAnnouncer + main-aria-label. */
  screenTitle: string;
  children:    React.ReactNode;
}
function Frame({ swUpdate, screenTitle, children }: FrameProps) {
  useDocumentTitle(screenTitle);
  return (
    <div style={st.root}>
      <SkipLink />
      <RouteAnnouncer routeKey={screenTitle} message={screenTitle} />
      <NetworkStatus />
      {children}
      <StatusBar swUpdate={swUpdate} />
    </div>
  );
}

/** Заголовок таба для sr-only h1 + aria-label main. */
function tabHeading(tab: string, isTeacher: boolean): string {
  if (tab === "today")       return "Сегодня";
  if (tab === "schedule")    return isTeacher ? "Расписание занятий" : "Моё расписание";
  if (tab === "performance") return "Дисциплины и успеваемость";
  if (tab === "gradebook")   return "Зачётная книжка";
  if (tab === "tasks")       return "Задания на проверку";
  if (tab === "profile")     return "Профиль";
  return "Главный экран";
}

const st: Record<string, CSSProperties> = {
  root:      { display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "var(--c-bg)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  // padding НЕ здесь — инлайн-стиль перебил бы md:pt-8 в className
  // (у main#main-content, UnifiedShell.tsx). Tailwind preflight и так
  // зануляет паддинг по умолчанию, инлайн-"0" был избыточен.
  // display:flex+column (найдено 2026-07-02, вместе с возвратом Header/Nav на
  // детальные экраны): SubHeader (shrink-0) внутри lesson/unit/group и т.п.
  // должен оставаться прижатым к верху, пока скроллится контент под ним —
  // раньше это давал flex-column корня Frame, теперь main сам эту роль несёт.
  // На обычных вкладках (Today/Schedule/...) с одним не-flex ребёнком ничего
  // не меняется — просто ещё один уровень flex-column вокруг блочного контента.
  body:      { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" },
  stub:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 32 },
  stubIcon:  { fontSize: 48 },
  stubTitle: { fontSize: "1rem", fontWeight: 600, color: "var(--c-text-primary)" },
  stubSub:   { fontSize: "0.82rem", color: "var(--c-text-muted)", textAlign: "center" as const, lineHeight: 1.5 },
};
