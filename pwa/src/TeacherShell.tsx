import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import type { TeacherScheduleResponse, TeacherScheduleSlot } from "@eios/contracts";
import { getThemeMode, setTheme, type ThemeMode } from "./theme.js";
import { CalIcon, PersonIcon } from "./components/icons/index.js";
import { TeacherScheduleTab } from "./screens/teacher/TeacherScheduleTab.js";
import { TeacherLessonScreen } from "./screens/teacher/TeacherLessonScreen.js";
import { onSwUpdate } from "./sw-update.js";
import { StatusBar } from "./shell/StatusBar.js";
import { Header, ContextLabel } from "./shell/Header.js";
import { BottomNav } from "./shell/BottomNav.js";
import { useRoute, navigate } from "./router.js";
import { canAccess, defaultRoute } from "./permissions.js";
import * as source from "./data/source.js";

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

export function TeacherShell({ authName, lkUrl, onLogout }: Props) {
  const { name: teacherName, eiv } = source.getTeacherIdentity(authName);
  const schedule   = source.getTeacherSchedule();
  const attendance = source.getAttendance();

  const route = useRoute();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getThemeMode);
  const [swUpdate, setSwUpdate]   = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { onSwUpdate(s => setSwUpdate(s === "available")); }, []);
  // Если педагог попал на чужой маршрут (например, набрал #/gradebook) — редиректим
  useEffect(() => {
    if (!canAccess("teacher", route)) navigate(defaultRoute("teacher"));
  }, [route]);

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
          <TeacherScheduleTab
            schedule={schedule}
            today={today}
            onLesson={(slot) => navigate({ name: "lesson", id: slot.slotId })}
          />
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
    <div style={pr.root}>
      <div style={pr.nameBlock}>
        <div style={pr.avatar}>{teacherName.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
        <div>
          <div style={pr.name}>{teacherName}</div>
          <div style={pr.role}>Педагог</div>
        </div>
      </div>

      <div style={pr.section}>
        <div style={pr.sectionLabel}>Тема</div>
        <div style={pr.themeRow}>
          {THEMES.map(t => (
            <button
              key={t.id}
              style={{ ...pr.themeBtn, ...(themeMode === t.id ? pr.themeBtnActive : {}) }}
              onClick={() => onThemeChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {lkUrl && (
        <a href={lkUrl} target="_blank" rel="noopener noreferrer" style={pr.lkLink}>
          Личный кабинет Univerkon ↗
        </a>
      )}

      {onLogout && (
        <button style={pr.logoutBtn} onClick={onLogout}>Выйти</button>
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

const pr: Record<string, CSSProperties> = {
  root:       { padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 },
  nameBlock:  { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "var(--c-card)", borderRadius: 14 },
  avatar:     { width: 48, height: 48, borderRadius: "50%", background: "var(--c-accent)", color: "#fff", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  name:       { fontSize: "0.95rem", fontWeight: 600, color: "var(--c-text-primary)" },
  role:       { fontSize: "0.75rem", color: "var(--c-accent)", marginTop: 2 },
  section:    { background: "var(--c-card)", borderRadius: 14, padding: "14px 16px" },
  sectionLabel:{ fontSize: "0.72rem", color: "var(--c-text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", fontWeight: 600, marginBottom: 10 },
  themeRow:   { display: "flex", gap: 6 },
  themeBtn:   { flex: 1, background: "var(--c-card)", border: "0.5px solid var(--c-border)", borderRadius: 8, padding: "8px 4px", fontSize: "0.78rem", color: "var(--c-text-secondary)", cursor: "pointer" },
  themeBtnActive: { border: "1.5px solid var(--c-accent)", color: "var(--c-accent)", fontWeight: 600 },
  lkLink:     { display: "block", textAlign: "center" as const, color: "var(--c-accent)", fontSize: "0.85rem", padding: "12px 0", textDecoration: "none" },
  logoutBtn:  { width: "100%", background: "none", border: "1px solid var(--c-danger)", borderRadius: 12, padding: "13px 0", fontSize: "0.9rem", color: "var(--c-danger)", cursor: "pointer" },
};

