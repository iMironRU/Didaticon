/**
 * ScheduleScreen — generic frame для расписания.
 *
 * Не знает про роли. Принимает:
 *   - entries[] (нормализованные `{date, slot}`)
 *   - renderSlot — функция, рендерит карточку для конкретного типа слота
 *
 * Используется LearnerSlotCard (студент/родитель) и TeacherSlotCard (педагог).
 * См. memory: architecture.md → правила 1, 3, 6.
 */
import type { ReactNode } from "react";
import { useLocale } from "../../locale.js";
import { formatDay } from "../../utils/date.js";

interface Props<T extends { date: string }> {
  /** Каждая запись должна иметь поле `date` (ISO "YYYY-MM-DD"). Остальное — на усмотрение consumer-а. */
  entries:      T[];
  fromDate:     string;   // начало полосы дней
  toDate:       string;   // конец полосы дней
  today:        string;
  view:         "day" | "week";
  onViewChange: (v: "day" | "week") => void;
  selectedDate: string;
  onDateChange: (d: string) => void;
  /** Возвращает JSX карточки. Сам ставит `key` через React. showDate=true для week-вида. */
  renderSlot:   (entry: T, showDate: boolean) => ReactNode;
  emptyText:    string;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const cur = parseLocalDate(from);
  const end = parseLocalDate(to);
  while (cur <= end) {
    out.push(isoFromDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function weekOf(selected: string): string[] {
  const d = parseLocalDate(selected);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(start);
    dt.setDate(start.getDate() + i);
    return isoFromDate(dt);
  });
}

export function ScheduleScreen<T extends { date: string }>({
  entries, fromDate, toDate, today, view, onViewChange,
  selectedDate, onDateChange, renderSlot, emptyText,
}: Props<T>) {
  const { t } = useLocale();
  const stripDates = dateRange(fromDate, toDate);
  const weekDates  = weekOf(selectedDate);

  const visible = view === "day"
    ? entries.filter(e => e.date === selectedDate)
    : entries.filter(e => weekDates.includes(e.date));

  const selDt   = parseLocalDate(selectedDate);
  const week0   = parseLocalDate(weekDates[0]);
  const week6   = parseLocalDate(weekDates[6]);

  return (
    <div>
      {/* Тоггл день/неделя */}
      <div className="flex bg-surface rounded-lg p-[3px] mb-3">
        <button
          className={
            "flex-1 border-0 bg-transparent text-[0.82rem] font-medium py-1.5 rounded-md cursor-pointer " +
            (view === "day" ? "bg-line text-fg" : "text-fg-muted")
          }
          onClick={() => onViewChange("day")}
        >{t("day")}</button>
        <button
          className={
            "flex-1 border-0 bg-transparent text-[0.82rem] font-medium py-1.5 rounded-md cursor-pointer " +
            (view === "week" ? "bg-line text-fg" : "text-fg-muted")
          }
          onClick={() => onViewChange("week")}
        >{t("week")}</button>
      </div>

      {/* Полоса дней */}
      <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
        {stripDates.map(iso => {
          const hasEntries = entries.some(e => e.date === iso);
          const isSelected = iso === selectedDate;
          const isToday    = iso === today;
          const wdLabel = parseLocalDate(iso).toLocaleDateString("ru", { weekday: "short" });
          const num     = parseLocalDate(iso).getDate();
          return (
            <button
              key={iso}
              className="flex flex-col items-center gap-[3px] bg-transparent border-0 cursor-pointer px-1 shrink-0"
              onClick={() => { onDateChange(iso); onViewChange("day"); }}
            >
              <span
                className="text-[0.62rem] capitalize"
                style={{ color: isSelected ? "var(--c-accent)" : isToday ? "var(--c-text-primary)" : "var(--c-text-muted)" }}
              >
                {wdLabel}
              </span>
              <span
                className="w-7 h-7 rounded-full text-[0.82rem] flex items-center justify-center"
                style={{
                  background: isSelected ? "var(--c-accent)" : "transparent",
                  color: isSelected ? "#fff" : isToday ? "var(--c-text-primary)" : "var(--c-text-secondary)",
                  fontWeight: isToday ? 700 : 500,
                }}
              >
                {num}
              </span>
              {hasEntries && (
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: isSelected ? "#fff" : "var(--c-accent)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Заголовок периода */}
      <div className="text-fg-muted text-[0.68rem] tracking-[0.08em] uppercase mb-2.5 font-semibold">
        {view === "day"
          ? (selectedDate === today ? t("today") : formatDay(selDt))
          : `${formatDay(week0)} — ${formatDay(week6)}`}
      </div>

      {/* Карточки */}
      {visible.length === 0
        ? <div className="text-fg-dim text-center py-8 text-[0.85rem]">{emptyText}</div>
        : visible
            .sort((a, b) => a.date === b.date ? 0 : a.date.localeCompare(b.date))
            .map((entry, i) => (
              <div key={i}>
                {renderSlot(entry, view === "week")}
              </div>
            ))
      }
    </div>
  );
}
