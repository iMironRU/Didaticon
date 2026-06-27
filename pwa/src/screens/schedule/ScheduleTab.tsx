import type { CSSProperties } from "react";
import type { ScheduleSlot, TrajectoryLesson } from "@eios/contracts";
import { LESSON_TYPE_LABEL, LESSON_TYPE_COLOR } from "../../utils/grade.js";
import { hexToRgba, } from "../../utils/color.js";
import { startOfWeek, sameDay, formatDay } from "../../utils/date.js";
import { useLocale } from "../../locale.js";

// ── Тип объединённого слота (расписание + траектория) ─────────────────────────
export interface ScheduleItem {
  date:   string;           // ISO date "YYYY-MM-DD" из ScheduleDay
  slot:   ScheduleSlot;
  lesson: TrajectoryLesson | null;  // null если слот вне траектории
}

interface Props {
  items:        ScheduleItem[];
  fromDate:     string;   // ISO date — начало полосы дней
  toDate:       string;   // ISO date — конец полосы дней
  today:        string;   // ISO date
  view:         "day" | "week";
  onViewChange: (v: "day" | "week") => void;
  selectedDate: string;   // ISO date
  onDateChange: (d: string) => void;
  onItem:       (item: ScheduleItem) => void;
}

// Вспомогательные функции для работы с ISO-датами ─────────────────────────────

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Генерирует все ISO-даты от from до to включительно
function dateRange(from: string, to: string): string[] {
  const result: string[] = [];
  const cur = parseLocalDate(from);
  const end = parseLocalDate(to);
  while (cur <= end) {
    result.push(isoFromDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

// ISO-даты недели (пн–вс), содержащей selectedDate
function weekOf(selected: string): string[] {
  const d = parseLocalDate(selected);
  const start = startOfWeek(d); // из date.ts (понедельник)
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    return isoFromDate(dt);
  });
}

// ── Компоненты ────────────────────────────────────────────────────────────────

export function ScheduleTab({ items, fromDate, toDate, today, view, onViewChange, selectedDate, onDateChange, onItem }: Props) {
  const { t } = useLocale();
  const stripDates = dateRange(fromDate, toDate);
  const weekDates  = weekOf(selectedDate);

  const visibleItems = view === "day"
    ? items.filter(i => i.date === selectedDate).sort((a, b) => a.slot.timeStart.localeCompare(b.slot.timeStart))
    : items.filter(i => weekDates.includes(i.date)).sort((a, b) =>
        a.date === b.date ? a.slot.timeStart.localeCompare(b.slot.timeStart) : a.date.localeCompare(b.date));

  const selDt   = parseLocalDate(selectedDate);
  const week0Dt = parseLocalDate(weekDates[0]);
  const week6Dt = parseLocalDate(weekDates[6]);

  return (
    <div>
      {/* Тоггл день/неделя */}
      <div style={st.toggle}>
        <button style={{ ...st.toggleBtn, ...(view === "day"  ? st.toggleActive : {}) }} onClick={() => onViewChange("day")}>{t("day")}</button>
        <button style={{ ...st.toggleBtn, ...(view === "week" ? st.toggleActive : {}) }} onClick={() => onViewChange("week")}>{t("week")}</button>
      </div>

      {/* Горизонтальная полоса дней */}
      <div style={st.dayStrip}>
        {stripDates.map(iso => {
          const hasItems  = items.some(i => i.date === iso);
          const isSelected = iso === selectedDate;
          const isToday    = iso === today;
          const label      = parseLocalDate(iso).toLocaleDateString("ru", { weekday: "short" });
          const num        = parseLocalDate(iso).getDate();
          return (
            <button key={iso} style={st.dayBtn}
              onClick={() => { onDateChange(iso); onViewChange("day"); }}>
              <span style={{ ...st.dayBtnWd, color: isSelected ? "var(--c-accent)" : isToday ? "var(--c-text-primary)" : "var(--c-text-muted)" }}>
                {label}
              </span>
              <span style={{
                ...st.dayBtnNum,
                background: isSelected ? "var(--c-accent)" : "transparent",
                color: isSelected ? "#fff" : isToday ? "var(--c-text-primary)" : "var(--c-text-secondary)",
                fontWeight: isToday ? 700 : 500,
              }}>
                {num}
              </span>
              {hasItems && <span style={{ ...st.dayDot, background: isSelected ? "#fff" : "var(--c-accent)" }} />}
            </button>
          );
        })}
      </div>

      {/* Заголовок периода */}
      <div style={st.sectionLabel}>
        {view === "day"
          ? (selectedDate === today ? t("today") : formatDay(selDt))
          : `${formatDay(week0Dt)} — ${formatDay(week6Dt)}`
        }
      </div>

      {/* Карточки занятий */}
      {visibleItems.length === 0
        ? <div style={st.empty}>{t("noLessons")}</div>
        : visibleItems.map(item => (
          <LessonCard
            key={item.slot.slotId}
            item={item}
            today={today}
            showDate={view === "week"}
            onOpen={() => onItem(item)}
          />
        ))
      }
    </div>
  );
}

// ── Карточка занятия ──────────────────────────────────────────────────────────

interface CardProps {
  item:     ScheduleItem;
  today:    string;
  showDate: boolean;
  onOpen:   () => void;
}

export function LessonCard({ item, today, showDate, onOpen }: CardProps) {
  const { t } = useLocale();
  const { date, slot, lesson } = item;

  const lessonType = lesson?.lessonType ?? "лекция";
  const typeColor  = LESSON_TYPE_COLOR[lessonType];
  const typeLabel  = LESSON_TYPE_LABEL[lessonType];
  const topic      = lesson?.topic ?? slot.unitRef.title;
  const isFuture   = date > today;
  const isDone     = date < today;

  return (
    <div
      style={{ ...st.card, opacity: isFuture ? 0.55 : 1 }}
      onClick={isFuture ? undefined : onOpen}
    >
      <div style={{ ...st.typeTag, background: hexToRgba(typeColor, 0.15), color: typeColor }}>
        {typeLabel}
      </div>
      <div style={st.cardBody}>
        {showDate && (
          <div style={st.cardDate}>
            {formatDay(parseLocalDate(date))} · {slot.timeStart}–{slot.timeEnd}
          </div>
        )}
        {!showDate && (
          <div style={st.cardDate}>{slot.timeStart}–{slot.timeEnd}{slot.room ? ` · ${slot.room}` : ""}</div>
        )}
        <div style={st.cardUnit}>{slot.unitRef.title}</div>
        <div style={{ ...st.cardTopic, color: isFuture ? "var(--c-text-muted)" : "var(--c-text-primary)" }}>
          {topic}
        </div>
        {slot.hasControl && !isFuture && (
          <div style={st.cardControl}>{t("controlSection")}</div>
        )}
        {isFuture && <div style={st.cardLocked}>{t("notAvailable")}</div>}
      </div>
      {!isFuture && <div style={st.cardChevron}>›</div>}
      {isDone && <div style={st.doneDot} />}
    </div>
  );
}

// ── Стили ─────────────────────────────────────────────────────────────────────
const st: Record<string, CSSProperties> = {
  toggle:      { display: "flex", background: "var(--c-card)", borderRadius: 8, padding: 3, marginBottom: 12 },
  toggleBtn:   { flex: 1, border: "none", background: "none", color: "var(--c-text-muted)", fontSize: "0.82rem", fontWeight: 500, padding: "6px 0", borderRadius: 6, cursor: "pointer" },
  toggleActive:{ background: "var(--c-border)", color: "var(--c-text-primary)" },
  dayStrip:    { display: "flex", gap: 4, overflowX: "auto", marginBottom: 16, paddingBottom: 4 },
  dayBtn:      { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "0 4px", flexShrink: 0 },
  dayBtnWd:    { fontSize: "0.62rem", textTransform: "capitalize" as const },
  dayBtnNum:   { width: 28, height: 28, borderRadius: "50%", fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center" },
  dayDot:      { width: 4, height: 4, borderRadius: "50%" },
  sectionLabel:{ color: "var(--c-text-muted)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 10, fontWeight: 600 },
  empty:       { color: "var(--c-text-dim)", textAlign: "center" as const, padding: "32px 0", fontSize: "0.85rem" },
  card:        { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" },
  typeTag:     { borderRadius: 4, padding: "2px 6px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0, marginTop: 2 },
  cardBody:    { flex: 1, minWidth: 0 },
  cardDate:    { color: "var(--c-text-muted)", fontSize: "0.68rem", marginBottom: 2 },
  cardUnit:    { color: "var(--c-accent)", fontSize: "0.68rem", marginBottom: 3, fontWeight: 500 },
  cardTopic:   { fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.3 },
  cardControl: { color: "var(--c-text-muted)", fontSize: "0.7rem", marginTop: 4 },
  cardLocked:  { color: "var(--c-text-dim)", fontSize: "0.7rem", marginTop: 4 },
  cardChevron: { color: "var(--c-text-dim)", fontSize: "1.2rem", lineHeight: 1, flexShrink: 0, alignSelf: "center" },
  doneDot:     { width: 6, height: 6, borderRadius: "50%", background: "var(--c-success)", flexShrink: 0, marginTop: 4 },
};
