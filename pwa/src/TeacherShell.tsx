import { useState } from "react";
import type { CSSProperties } from "react";
import type { TeacherScheduleResponse, TeacherScheduleSlot, AttendanceResponse } from "@eios/contracts";
import { getThemeMode, setTheme, type ThemeMode } from "./theme.js";
import { LogoIcon, CalIcon, PersonIcon } from "./components/icons/index.js";
import { TeacherScheduleTab } from "./screens/teacher/TeacherScheduleTab.js";
import { TeacherLessonScreen } from "./screens/teacher/TeacherLessonScreen.js";
import { onSwUpdate } from "./sw-update.js";
import { StatusBar } from "./shell/StatusBar.js";
import { useEffect } from "react";

type TeacherTab = "schedule" | "tasks" | "profile";

interface Props {
  teacherName: string;
  schedule:    TeacherScheduleResponse;
  attendance:  Record<string, AttendanceResponse>;
  eiv:         string;
  lkUrl?:      string;
  onLogout?:   () => void;
}

export function TeacherShell({ teacherName, schedule, attendance, eiv, lkUrl, onLogout }: Props) {
  const [tab, setTab]           = useState<TeacherTab>("schedule");
  const [themeMode, setThemeMode] = useState<ThemeMode>(getThemeMode);
  const [swUpdate, setSwUpdate] = useState(false);
  const [lessonState, setLessonState] = useState<{ slot: TeacherScheduleSlot; date: string } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { onSwUpdate(s => setSwUpdate(s === "available")); }, []);
  function handleThemeChange(mode: ThemeMode) { setTheme(mode); setThemeMode(mode); }

  const initials = teacherName.split(" ").map(w => w[0]).slice(0, 2).join("");

  if (lessonState) {
    const att = attendance[lessonState.slot.slotId]?.students ?? [];
    return (
      <div style={st.root}>
        <TeacherLessonScreen
          slot={lessonState.slot}
          date={lessonState.date}
          students={att}
          onBack={() => setLessonState(null)}
        />
        <StatusBar swUpdate={swUpdate} eiv={eiv} />
      </div>
    );
  }

  return (
    <div style={st.root}>
      {/* Шапка */}
      <header style={st.header}>
        <div style={st.headerLogo}>
          <LogoIcon />
          <span style={st.headerTitle}>ЭИОС</span>
        </div>
        <div style={st.headerRole}>Педагог</div>
        <div style={st.avatar}>{initials}</div>
      </header>

      {/* Контент */}
      <div style={st.body}>
        {tab === "schedule" && (
          <TeacherScheduleTab
            schedule={schedule}
            today={today}
            onLesson={(slot, date) => setLessonState({ slot, date })}
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

      {/* Нижняя навигация */}
      <nav style={st.bottomNav}>
        {([
          { id: "schedule" as TeacherTab, label: "Расписание", icon: <CalIcon /> },
          { id: "tasks"    as TeacherTab, label: "Задания",    icon: <span style={{ fontSize: 20 }}>📋</span> },
          { id: "profile"  as TeacherTab, label: "Профиль",   icon: <PersonIcon /> },
        ]).map(it => {
          const active = tab === it.id;
          return (
            <button key={it.id} style={st.navItem} onClick={() => setTab(it.id)}>
              <span style={{ color: active ? "var(--c-accent)" : "var(--c-text-dim)" }}>{it.icon}</span>
              <span style={{ ...st.navLabel, color: active ? "var(--c-accent)" : "var(--c-text-dim)" }}>{it.label}</span>
            </button>
          );
        })}
      </nav>

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
  root:       { display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "var(--c-bg)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header:     { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--c-header)", borderBottom: "0.5px solid var(--c-border)", flexShrink: 0 },
  headerLogo: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  headerTitle:{ color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 700 },
  headerRole: { flex: 1, fontSize: "0.72rem", color: "var(--c-accent)", fontWeight: 600, paddingLeft: 4 },
  avatar:     { width: 28, height: 28, borderRadius: "50%", background: "var(--c-accent)", color: "#fff", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  body:       { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },
  bottomNav:  { background: "var(--c-header)", borderTop: "0.5px solid var(--c-border)", display: "flex", padding: "6px 0 10px", flexShrink: 0 },
  navItem:    { flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3, padding: "4px 0" },
  navLabel:   { fontSize: "0.62rem", fontWeight: 500 },
  stub:       { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 32 },
  stubIcon:   { fontSize: 48 },
  stubTitle:  { fontSize: "1rem", fontWeight: 600, color: "var(--c-text)" },
  stubSub:    { fontSize: "0.82rem", color: "var(--c-text2)", textAlign: "center" as const, lineHeight: 1.5 },
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

