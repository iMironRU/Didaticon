import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type {
  Person, Learner, UnitLeaf, UnitGroup, CurriculumUnit, TrajectoryLesson,
  Notification,
} from "@eios/contracts";
import type { ScheduleResponse, ScheduleSlot } from "@eios/contracts";
import type { GradebookResponse, GradebookEntry, BookingSlot } from "@eios/contracts";
import type { NotificationsResponse } from "@eios/contracts";
import { useRoute, navigate } from "../router.js";
import { getThemeMode, setTheme, type ThemeMode } from "../theme.js";
import { useLocale } from "../locale.js";
import { onSwUpdate } from "../sw-update.js";
import { StatusBar } from "./StatusBar.js";
import { ScheduleScreen } from "../screens/schedule/ScheduleScreen.js";
import { LearnerSlotCard, type LearnerSlotEntry } from "../screens/schedule/LearnerSlotCard.js";
import { LearnerLessonScreen } from "../screens/lesson/LearnerLessonScreen.js";
import { PerformanceTab } from "../screens/performance/PerformanceTab.js";
import { UnitScreen } from "../screens/performance/UnitScreen.js";
import { GroupScreen } from "../screens/performance/GroupScreen.js";
import { GradebookTab } from "../screens/gradebook/GradebookTab.js";
import { ProfileTab } from "../screens/profile/ProfileTab.js";
import { ContextSwitcherScreen } from "../screens/profile/ContextSwitcherScreen.js";
import { NotificationsScreen, NotificationDetailScreen } from "../screens/notifications/NotificationsScreen.js";
import { CalIcon, BookIcon, GradebookIcon, PersonIcon } from "../components/icons/index.js";
import { Header, ContextSwitcher, ContextLabel } from "./Header.js";
import { BottomNav } from "./BottomNav.js";
import * as source from "../data/source.js";

interface Props {
  role:      source.Role;     // "student" | "parent" — данные тянем из data/source
  lkUrl?:    string;
  onLogout?: () => void;
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

// ── Главный компонент ─────────────────────────────────────────────────────────
export function StudentView({ role, lkUrl, onLogout }: Props) {
  const person        = source.getPerson(role);
  const scheduleMap   = source.getScheduleMap();
  const gradebookMap  = source.getGradebookMap();
  const notifProp     = source.getNotifications();
  const route = useRoute();
  const { t, locale, changeLocale } = useLocale();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getThemeMode);
  const [scheduleView, setScheduleView] = useState<"day" | "week">("day");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Для родителя список "обучающихся" — это children, для студента — learners
  const allLearners = person.personType === "parent" ? (person.children ?? []) : person.learners;

  const [currentLearnerId, setCurrentLearnerId] = useState(() =>
    localStorage.getItem("eios_default_learner") ?? allLearners[0]?.learnerId ?? "");
  const [defaultLearnerId, setDefaultLearnerId] = useState(() =>
    localStorage.getItem("eios_default_learner") ?? allLearners[0]?.learnerId ?? "");
  const [notifs, setNotifs] = useState(notifProp.notifications);
  const [swUpdate, setSwUpdate] = useState(false);

  useEffect(() => { onSwUpdate(s => setSwUpdate(s === "available")); }, []);

  function handleThemeChange(mode: ThemeMode) { setTheme(mode); setThemeMode(mode); }
  function markRead(id: string)  { setNotifs(ns => ns.map(n => n.notificationId === id ? { ...n, read: true } : n)); }
  function markAllRead()         { setNotifs(ns => ns.map(n => ({ ...n, read: true }))); }
  function setDefault(lid: string) { localStorage.setItem("eios_default_learner", lid); setDefaultLearnerId(lid); }
  function switchLearner(lid: string) { setCurrentLearnerId(lid); navigate({ name: "schedule" }); }

  const learner: Learner = allLearners.find(l => l.learnerId === currentLearnerId) ?? allLearners[0];
  const schedule  = scheduleMap.get(learner?.learnerId ?? "");
  const gradebook = gradebookMap.get(learner?.learnerId ?? "");
  const lessonMap = collectLessons(learner?.units ?? []);
  const schedItems = buildScheduleItems(schedule, lessonMap);
  const unreadCount = notifs.filter(n => !n.read).length;
  const initials = (person.lastName[0] ?? "") + (person.firstName[0] ?? "");
  const debtCount   = gradebook
    ? gradebook.semesters.flatMap(s => s.entries).filter(
        e => e.finalControl.state === "failed_retake_pending" || e.finalControl.state === "failed_retake_scheduled"
      ).length
    : 0;
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
        <LearnerLessonScreen
          lesson={entry.lesson}
          slot={slotInfo?.slot ?? null}
          slotDate={slotInfo?.date ?? null}
          unitTitle={entry.unitTitle}
          onBack={() => history.back()}
          onLaunch={() => entry.lesson.packageUrl && window.open(entry.lesson.packageUrl)}
          readOnly={role === "parent"}
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
          initials={initials}
          onAvatarTap={() => navigate({ name: "profile" })}
          bell={{ unreadCount, onTap: () => navigate({ name: "notifications" }) }}
          middle={
            <ContextSwitcher
              programType={learner.programType}
              group={learner.group}
              periodLabel={learner.periodLabel}
              onTap={allLearners.length > 1 ? () => navigate({ name: "contexts" }) : undefined}
            />
          }
        />
        <div style={st.body}>
          {tab === "schedule" && (
            <ScheduleScreen
              entries={schedItems}
              fromDate={schedule?.from ?? today}
              toDate={schedule?.to   ?? today}
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
              onLocaleChange={changeLocale}
              lkUrl={lkUrl}
              onSwitchContext={allLearners.length > 1 ? () => navigate({ name: "contexts" }) : undefined}
              onLogout={onLogout}
            />
          )}
        </div>
        <BottomNav
          activeId={tab}
          onTap={(id) => navigate({ name: id as "schedule" | "performance" | "gradebook" | "profile" })}
          tabs={[
            { id: "schedule",    label: t("schedule"),    icon: <CalIcon /> },
            { id: "performance", label: t("disciplines"), icon: <BookIcon /> },
            { id: "gradebook",   label: t("gradebook"),   icon: <GradebookIcon />, badge: debtCount },
            { id: "profile",     label: t("profile"),     icon: <PersonIcon /> },
          ]}
        />
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

// ── Стили ─────────────────────────────────────────────────────────────────────
const st: Record<string, CSSProperties> = {
  root: { display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "var(--c-bg)" },
  body: { flex: 1, overflowY: "auto", padding: "12px 16px" },
};

// type augmentation для Vite define
