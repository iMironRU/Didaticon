import { useState } from "react";
import type { TeacherScheduleResponse, TeacherScheduleSlot, RefuseReason } from "@eios/contracts";

interface Props {
  schedule: TeacherScheduleResponse;
  today:    string; // YYYY-MM-DD
  onLesson: (slot: TeacherScheduleSlot, date: string) => void;
}

const REFUSE_LABELS: Record<RefuseReason, string> = {
  illness:      "Болезнь",
  business_trip: "Командировка",
  other:        "Другое",
};

export function TeacherScheduleTab({ schedule, today, onLesson }: Props) {
  const [view, setView] = useState<"day" | "week">("day");
  const [selectedDate, setSelectedDate] = useState(today);
  const [refuseSlot, setRefuseSlot] = useState<TeacherScheduleSlot | null>(null);
  const [refuseReason, setRefuseReason] = useState<RefuseReason | null>(null);
  const [refusedSlots, setRefusedSlots] = useState<Set<string>>(new Set());

  const days = view === "day"
    ? schedule.days.filter(d => d.date === selectedDate)
    : schedule.days;

  const todayIdx   = schedule.days.findIndex(d => d.date === today);
  const weekStart  = todayIdx >= 0 ? Math.max(0, todayIdx - (todayIdx % 7)) : 0;
  const weekDays   = schedule.days.slice(weekStart, weekStart + 7);
  const navDays    = view === "day" ? schedule.days : weekDays;

  function handleRefuseConfirm() {
    if (!refuseSlot || !refuseReason) return;
    setRefusedSlots(prev => new Set([...prev, refuseSlot.slotId]));
    setRefuseSlot(null);
    setRefuseReason(null);
  }

  return (
    <div style={s.root}>
      {/* Вид */}
      <div style={s.viewToggle}>
        <button style={{ ...s.viewBtn, ...(view === "day" ? s.viewBtnActive : {}) }} onClick={() => setView("day")}>День</button>
        <button style={{ ...s.viewBtn, ...(view === "week" ? s.viewBtnActive : {}) }} onClick={() => setView("week")}>Неделя</button>
      </div>

      {/* Навигация по датам */}
      <div style={s.datePicker}>
        {(view === "day" ? schedule.days : weekDays).map(d => {
          const dd = d.date.slice(8, 10);
          const isToday = d.date === today;
          const isSel   = d.date === selectedDate;
          const hasSlt  = d.slots.length > 0;
          return (
            <button
              key={d.date}
              style={{ ...s.dayBtn, ...(isSel ? s.dayBtnSel : {}), ...(isToday ? s.dayBtnToday : {}) }}
              onClick={() => { setSelectedDate(d.date); if (view === "week") setView("day"); }}
            >
              <span style={s.dayName}>{d.weekday.slice(0, 2)}</span>
              <span style={s.dayNum}>{dd}</span>
              {hasSlt && <span style={{ ...s.dot, background: isSel ? "#fff" : "var(--c-accent)" }} />}
            </button>
          );
        })}
      </div>

      {/* Занятия */}
      <div style={s.list}>
        {days.map(day => (
          <div key={day.date}>
            {view === "week" && (
              <div style={s.dateHeader}>{day.weekday}, {day.date.slice(8, 10)}.{day.date.slice(5, 7)}</div>
            )}
            {day.slots.length === 0 && view === "week" && (
              <div style={s.empty}>Нет занятий</div>
            )}
            {day.slots.map(slot => {
              const refused = refusedSlots.has(slot.slotId);
              const groupStr = slot.groups.map(g => `${g.title} (${g.count})`).join(", ");
              return (
                <div key={slot.slotId} style={{ ...s.card, ...(refused ? s.cardRefused : {}) }}
                  onClick={() => !refused && onLesson(slot, day.date)}
                >
                  <div style={s.cardTime}>{slot.timeStart}–{slot.timeEnd}</div>
                  <div style={s.cardMain}>
                    <div style={s.cardTitle}>{slot.unitRef.title}</div>
                    <div style={s.cardMeta}>
                      <span style={s.kindBadge}>{slot.lessonKind}</span>
                      {slot.room && <span style={s.metaItem}>· {slot.room}</span>}
                    </div>
                    <div style={s.cardGroups}>{groupStr}</div>
                    {refused && <div style={s.refusedLabel}>Отказ подан</div>}
                  </div>
                  {!refused && slot.canRefuse && (
                    <button
                      style={s.refuseBtn}
                      onClick={e => { e.stopPropagation(); setRefuseSlot(slot); setRefuseReason(null); }}
                    >
                      Отказаться
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {days.every(d => d.slots.length === 0) && view === "day" && (
          <div style={s.emptyDay}>Занятий нет</div>
        )}
      </div>

      {/* Диалог отказа */}
      {refuseSlot && (
        <div style={s.overlay} onClick={() => setRefuseSlot(null)}>
          <div style={s.dialog} onClick={e => e.stopPropagation()}>
            <div style={s.dialogTitle}>Причина отказа</div>
            <div style={s.dialogSubtitle}>{refuseSlot.unitRef.title} · {refuseSlot.timeStart}</div>
            {(Object.entries(REFUSE_LABELS) as [RefuseReason, string][]).map(([key, label]) => (
              <button
                key={key}
                style={{ ...s.reasonBtn, ...(refuseReason === key ? s.reasonBtnSel : {}) }}
                onClick={() => setRefuseReason(key)}
              >
                {refuseReason === key ? "● " : "○ "}{label}
              </button>
            ))}
            <div style={s.dialogActions}>
              <button style={s.cancelBtn} onClick={() => setRefuseSlot(null)}>Отмена</button>
              <button
                style={{ ...s.confirmBtn, ...(refuseReason ? {} : s.confirmBtnDisabled) }}
                onClick={handleRefuseConfirm}
                disabled={!refuseReason}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root:      { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" },
  viewToggle:{ display: "flex", gap: 6, padding: "10px 16px 0" },
  viewBtn:   { flex: 1, background: "var(--c-surface2)", border: "none", borderRadius: 8, padding: "7px 0", fontSize: "0.82rem", color: "var(--c-text2)", cursor: "pointer" },
  viewBtnActive: { background: "var(--c-accent)", color: "#fff" },
  datePicker:{ display: "flex", gap: 4, padding: "10px 16px", overflowX: "auto" },
  dayBtn:    { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 40, padding: "6px 8px", background: "var(--c-surface2)", border: "none", borderRadius: 10, cursor: "pointer", gap: 2 },
  dayBtnSel: { background: "var(--c-accent)" },
  dayBtnToday:{ outline: "1.5px solid var(--c-accent)" },
  dayName:   { fontSize: "0.6rem", color: "var(--c-text2)", textTransform: "uppercase" as const },
  dayNum:    { fontSize: "0.9rem", fontWeight: 600, color: "var(--c-text)" },
  dot:       { width: 4, height: 4, borderRadius: "50%" },
  list:      { flex: 1, padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 },
  dateHeader:{ fontSize: "0.75rem", color: "var(--c-text2)", fontWeight: 600, marginTop: 10, marginBottom: 2, textTransform: "capitalize" as const },
  empty:     { fontSize: "0.78rem", color: "var(--c-text3)", padding: "4px 0" },
  emptyDay:  { textAlign: "center" as const, color: "var(--c-text3)", fontSize: "0.85rem", marginTop: 40 },
  card:      { background: "var(--c-surface2)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" },
  cardRefused:{ opacity: 0.5 },
  cardTime:  { fontSize: "0.75rem", color: "var(--c-text2)", minWidth: 72, paddingTop: 2 },
  cardMain:  { flex: 1 },
  cardTitle: { fontSize: "0.92rem", fontWeight: 600, color: "var(--c-text)", marginBottom: 4 },
  cardMeta:  { display: "flex", gap: 4, alignItems: "center", marginBottom: 3 },
  kindBadge: { fontSize: "0.68rem", background: "var(--c-surface3)", borderRadius: 4, padding: "1px 6px", color: "var(--c-accent)" },
  metaItem:  { fontSize: "0.75rem", color: "var(--c-text2)" },
  cardGroups:{ fontSize: "0.78rem", color: "var(--c-text2)" },
  refusedLabel:{ fontSize: "0.72rem", color: "var(--c-danger)", marginTop: 4 },
  refuseBtn: { flexShrink: 0, background: "none", border: "0.5px solid var(--c-danger)", borderRadius: 8, color: "var(--c-danger)", fontSize: "0.72rem", padding: "5px 10px", cursor: "pointer", alignSelf: "center" },
  // диалог
  overlay:   { position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "flex-end", zIndex: 100 },
  dialog:    { background: "var(--c-surface)", width: "100%", borderRadius: "16px 16px 0 0", padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 10 },
  dialogTitle: { fontSize: "1rem", fontWeight: 600, color: "var(--c-text)" },
  dialogSubtitle: { fontSize: "0.8rem", color: "var(--c-text2)", marginTop: -4 },
  reasonBtn: { background: "var(--c-surface2)", border: "0.5px solid var(--c-border)", borderRadius: 10, padding: "12px 14px", fontSize: "0.9rem", color: "var(--c-text)", cursor: "pointer", textAlign: "left" as const },
  reasonBtnSel: { border: "1.5px solid var(--c-accent)", color: "var(--c-accent)" },
  dialogActions: { display: "flex", gap: 8, marginTop: 4 },
  cancelBtn: { flex: 1, background: "var(--c-surface2)", border: "none", borderRadius: 10, padding: "13px 0", fontSize: "0.9rem", color: "var(--c-text2)", cursor: "pointer" },
  confirmBtn:{ flex: 1, background: "var(--c-danger)", border: "none", borderRadius: 10, padding: "13px 0", fontSize: "0.9rem", color: "#fff", fontWeight: 600, cursor: "pointer" },
  confirmBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
};
