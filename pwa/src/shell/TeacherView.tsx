import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type { TeacherScheduleResponse, TeacherScheduleSlot } from "@eios/contracts";
import { getThemeMode, setTheme, type ThemeMode } from "../theme.js";
import { CalIcon, PersonIcon } from "../components/icons/index.js";
import { ScheduleScreen } from "../screens/schedule/ScheduleScreen.js";
import { TeacherSlotCard } from "../screens/schedule/TeacherSlotCard.js";
import { TeacherLessonScreen } from "../screens/teacher/TeacherLessonScreen.js";
import { onSwUpdate } from "../sw-update.js";
import { StatusBar } from "./StatusBar.js";
import { Header, ContextLabel } from "./Header.js";
import { BottomNav } from "./BottomNav.js";
import { useRoute, navigate } from "../router.js";
import * as source from "../data/source.js";

function findSlotById(schedule: TeacherScheduleResponse, slotId: string): { slot: TeacherScheduleSlot; date: string } | null {
  for (const day of schedule.days) {
    for (const slot of day.slots) {
      if (slot.slotId === slotId) return { slot, date: day.date };
    }
  }
  return null;
}

interface Props {
  /** ФИО из auth; пустая строка → demo-режим, source подставит мок-педагога */
  authName: string;
  lkUrl?:   string;
  onLogout?: () => void;
}

export function TeacherView({ authName, lkUrl, onLogout }: Props) {
  const { name: teacherName, eiv } = source.getTeacherIdentity(authName);
  const schedule   = source.getTeacherSchedule();
  const attendance = source.getAttendance();

  const route = useRoute();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getThemeMode);
  const [swUpdate, setSwUpdate]   = useState(false);
  const [scheduleView, setScheduleView] = useState<"day" | "week">("day");

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  // Плоский список entries для ScheduleScreen (он не знает про nested days)
  const teacherEntries = schedule.days.flatMap(d => d.slots.map(slot => ({ date: d.date, slot })));
  const fromDate = schedule.days[0]?.date ?? today;
  const toDate   = schedule.days[schedule.days.length - 1]?.date ?? today;

  useEffect(() => { onSwUpdate(s => setSwUpdate(s === "available")); }, []);

  function handleThemeChange(mode: ThemeMode) { setTheme(mode); setThemeMode(mode); }

  const initials = teacherName.split(" ").map(w => w[0]).slice(0, 2).join("");
  const tab: "schedule" | "tasks" | "profile" =
    route.name === "tasks" || route.name === "profile" ? route.name : "schedule";

  // Экран урока (route.name === "lesson") берёт верх над основной разметкой
  if (route.name === "lesson") {
    const found = findSlotById(schedule, route.id);
    if (found) {
      const att = attendance[found.slot.slotId]?.students ?? [];
      return (
        <div style={st.root}>
          <TeacherLessonScreen
            slot={found.slot}
            date={found.date}
            students={att}
            onBack={() => history.back()}
          />
          <StatusBar swUpdate={swUpdate} eiv={eiv} />
        </div>
      );
    }
  }

  return (
    <div style={st.root}>
      <Header
        initials={initials}
        onAvatarTap={() => navigate({ name: "profile" })}
        middle={<ContextLabel text="Педагог" />}
      />

      {/* Контент */}
      <div style={st.body}>
        {tab === "schedule" && (
          <div className="px-4 py-2.5">
            <ScheduleScreen
              entries={teacherEntries}
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
          </div>
        )}
        {tab === "tasks" && (
          <div style={st.stub}>
            <div style={st.stubIcon}>📋</div>
            <div style={st.stubTitle}>Очередь заданий</div>
            <div style={st.stubSub}>Здесь будут задания студентов на проверку от Тестикона</div>
          </div>
        )}
        {tab === "profile" && (
          <TeacherProfile
            teacherName={teacherName}
            themeMode={themeMode}
            onThemeChange={handleThemeChange}
            lkUrl={lkUrl}
            onLogout={onLogout}
          />
        )}
      </div>

      <BottomNav
        activeId={tab}
        onTap={(id) => navigate({ name: id as "schedule" | "tasks" | "profile" })}
        tabs={[
          { id: "schedule", label: "Расписание", icon: <CalIcon /> },
          { id: "tasks",    label: "Задания",    icon: <span style={{ fontSize: 20 }}>📋</span> },
          { id: "profile",  label: "Профиль",   icon: <PersonIcon /> },
        ]}
      />

      <StatusBar swUpdate={swUpdate} eiv={eiv} />
    </div>
  );
}

function TeacherProfile({ teacherName, themeMode, onThemeChange, lkUrl, onLogout }: {
  teacherName:   string;
  themeMode:     ThemeMode;
  onThemeChange: (m: ThemeMode) => void;
  lkUrl?:        string;
  onLogout?:     () => void;
}) {
  const THEMES: { id: ThemeMode; label: string }[] = [
    { id: "auto",  label: "Авто"    },
    { id: "light", label: "Светлая" },
    { id: "dark",  label: "Тёмная"  },
  ];
  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div className="flex items-center gap-3.5 px-4 py-3.5 bg-surface rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-accent text-white text-base font-bold flex items-center justify-center shrink-0">
          {teacherName.split(" ").map(w => w[0]).slice(0, 2).join("")}
        </div>
        <div>
          <div className="text-[0.95rem] font-semibold text-fg">{teacherName}</div>
          <div className="text-xs text-accent mt-0.5">Педагог</div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl px-4 py-3.5">
        <div className="text-[0.72rem] text-fg-muted uppercase tracking-[0.06em] font-semibold mb-2.5">
          Тема
        </div>
        <div className="flex gap-1.5">
          {THEMES.map(t => (
            <button
              key={t.id}
              className={
                "flex-1 bg-surface rounded-lg px-1 py-2 text-[0.78rem] cursor-pointer " +
                (themeMode === t.id
                  ? "border-[1.5px] border-accent text-accent font-semibold"
                  : "border border-line text-fg-secondary")
              }
              onClick={() => onThemeChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {lkUrl && (
        <a
          href={lkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-accent text-[0.85rem] py-3 no-underline"
        >
          Личный кабинет Univerkon ↗
        </a>
      )}

      {onLogout && (
        <button
          className="w-full bg-transparent border border-danger rounded-xl py-3 text-[0.9rem] text-danger cursor-pointer"
          onClick={onLogout}
        >
          Выйти
        </button>
      )}
    </div>
  );
}

const st: Record<string, CSSProperties> = {
  root:      { display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "var(--c-bg)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  body:      { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },
  stub:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 32 },
  stubIcon:  { fontSize: 48 },
  stubTitle: { fontSize: "1rem", fontWeight: 600, color: "var(--c-text-primary)" },
  stubSub:   { fontSize: "0.82rem", color: "var(--c-text-muted)", textAlign: "center" as const, lineHeight: 1.5 },
};


