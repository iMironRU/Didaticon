import { useState } from "react";
import type { TeacherScheduleSlot, AttendanceStudent } from "@eios/contracts";

interface Props {
  slot:      TeacherScheduleSlot;
  date:      string;
  students:  AttendanceStudent[];
  onBack:    () => void;
}

export function TeacherLessonScreen({ slot, date, students: initialStudents, onBack }: Props) {
  const [started, setStarted]   = useState(slot.status === "in_progress");
  const [absent, setAbsent]     = useState<Set<string>>(new Set());
  const [saved, setSaved]       = useState(false);

  const groupStr = slot.groups.map(g => `${g.title}`).join(", ");

  function toggleAbsent(id: string) {
    setSaved(false);
    setAbsent(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function markAll()    { setSaved(false); setAbsent(new Set(initialStudents.map(s => s.studentId))); }
  function clearAll()   { setSaved(false); setAbsent(new Set()); }
  function invert()     { setSaved(false); setAbsent(new Set(initialStudents.filter(s => !absent.has(s.studentId)).map(s => s.studentId))); }
  function saveAttendance() { setSaved(true); }

  const fmt = (d: string) => {
    const parts = d.split("-");
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  return (
    <div style={s.root}>
      {/* Шапка */}
      <div style={s.header}>
        <button style={s.back} onClick={onBack}>‹</button>
        <div style={s.headerInfo}>
          <div style={s.headerTitle}>{slot.lessonKind} · {slot.unitRef.title}</div>
          <div style={s.headerMeta}>{fmt(date)} · {slot.timeStart}–{slot.timeEnd}{slot.room ? ` · ${slot.room}` : ""}</div>
        </div>
      </div>

      <div style={s.body}>
        {/* Старт */}
        {!started ? (
          <button style={s.startBtn} onClick={() => setStarted(true)}>
            ▶ Начать занятие
          </button>
        ) : (
          <div style={s.startedBadge}>● Занятие идёт</div>
        )}

        {/* Посещаемость */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>
              {groupStr} · {initialStudents.length} чел.
            </span>
            {absent.size > 0 && (
              <span style={s.absentCount}>отсутствует: {absent.size}</span>
            )}
          </div>

          {/* Массовые кнопки */}
          <div style={s.bulkRow}>
            <button style={s.bulkBtn} onClick={markAll}>Отметить всех</button>
            <button style={s.bulkBtn} onClick={clearAll}>Снять все</button>
            <button style={s.bulkBtn} onClick={invert}>Инвертировать</button>
          </div>

          {/* Список студентов */}
          <div style={s.studentList}>
            {initialStudents.map(st => {
              const isAbsent = absent.has(st.studentId);
              return (
                <div
                  key={st.studentId}
                  style={{ ...s.studentRow, ...(isAbsent ? s.studentRowAbsent : {}) }}
                  onClick={() => toggleAbsent(st.studentId)}
                >
                  <span style={{ ...s.checkbox, ...(isAbsent ? s.checkboxAbsent : {}) }}>
                    {isAbsent ? "●" : "○"}
                  </span>
                  <span style={s.studentName}>{st.name}</span>
                </div>
              );
            })}
          </div>

          <button
            style={{ ...s.saveBtn, ...(saved ? s.saveBtnDone : {}) }}
            onClick={saveAttendance}
          >
            {saved ? "✓ Сохранено" : `Сохранить · ${absent.size > 0 ? absent.size + " отсутств." : "все присутствуют"}`}
          </button>
        </div>

        {/* Задания */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Задания</div>
          <button style={s.tasksBtn}>
            📋 Очередь проверки
          </button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root:   { display: "flex", flexDirection: "column", height: "100dvh", background: "var(--c-bg)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
  header: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "0.5px solid var(--c-border)", background: "var(--c-surface)" },
  back:   { background: "none", border: "none", fontSize: "1.5rem", color: "var(--c-accent)", cursor: "pointer", lineHeight: 1, padding: "0 4px" },
  headerInfo: { flex: 1 },
  headerTitle:{ fontSize: "0.95rem", fontWeight: 600, color: "var(--c-text)" },
  headerMeta: { fontSize: "0.75rem", color: "var(--c-text2)", marginTop: 2 },
  body:   { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 16 },
  startBtn:   { width: "100%", background: "var(--c-accent)", border: "none", borderRadius: 12, padding: "15px 0", fontSize: "1rem", fontWeight: 600, color: "#fff", cursor: "pointer" },
  startedBadge:{ background: "rgba(52,199,89,.15)", color: "#34C759", borderRadius: 10, padding: "10px 16px", fontSize: "0.88rem", fontWeight: 600, textAlign: "center" as const },
  section:{ background: "var(--c-surface2)", borderRadius: 14, padding: "14px" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle:  { fontSize: "0.82rem", color: "var(--c-text2)", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  absentCount:   { fontSize: "0.78rem", color: "var(--c-danger)", fontWeight: 600 },
  bulkRow:{ display: "flex", gap: 6, marginBottom: 10 },
  bulkBtn:{ flex: 1, background: "var(--c-surface)", border: "0.5px solid var(--c-border)", borderRadius: 8, padding: "7px 4px", fontSize: "0.68rem", color: "var(--c-text2)", cursor: "pointer" },
  studentList: { display: "flex", flexDirection: "column", gap: 1, marginBottom: 12 },
  studentRow:  { display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 8, cursor: "pointer" },
  studentRowAbsent: { background: "rgba(255,59,48,.06)" },
  checkbox:    { fontSize: "0.9rem", color: "var(--c-text3)", width: 16, textAlign: "center" as const, flexShrink: 0 },
  checkboxAbsent: { color: "var(--c-danger)" },
  studentName: { fontSize: "0.88rem", color: "var(--c-text)" },
  saveBtn:{ width: "100%", background: "var(--c-accent)", border: "none", borderRadius: 10, padding: "13px 0", fontSize: "0.9rem", fontWeight: 600, color: "#fff", cursor: "pointer" },
  saveBtnDone: { background: "#34C759" },
  tasksBtn:{ width: "100%", background: "var(--c-surface)", border: "0.5px solid var(--c-border)", borderRadius: 10, padding: "13px 0", fontSize: "0.88rem", color: "var(--c-text)", cursor: "pointer", marginTop: 10 },
};
