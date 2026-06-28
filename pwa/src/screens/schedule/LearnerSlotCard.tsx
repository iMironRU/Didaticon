/**
 * LearnerSlotCard — карточка слота для студента/родителя.
 *
 * Содержит: цветной тип-тег (Лек/Пр/Лаб), время + аудитория, дисциплина, тема.
 * Будущие слоты — серым (opacity 0.55), без клика.
 * Прошедшие — с зелёной точкой "done".
 */
import type { ScheduleSlot, TrajectoryLesson } from "@eios/contracts";
import { LESSON_TYPE_LABEL, LESSON_TYPE_COLOR } from "../../utils/grade.js";
import { hexToRgba } from "../../utils/color.js";
import { formatDay } from "../../utils/date.js";
import { useLocale } from "../../locale.js";

export interface LearnerSlotEntry {
  date:   string;
  slot:   ScheduleSlot;
  lesson: TrajectoryLesson | null;
}

interface Props {
  entry:    LearnerSlotEntry;
  today:    string;
  showDate: boolean;
  onOpen:   () => void;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function LearnerSlotCard({ entry, today, showDate, onOpen }: Props) {
  const { t } = useLocale();
  const { date, slot, lesson } = entry;
  const lessonType = lesson?.lessonType ?? "лекция";
  const typeColor  = LESSON_TYPE_COLOR[lessonType];
  const typeLabel  = LESSON_TYPE_LABEL[lessonType];
  const topic      = lesson?.topic ?? slot.unitRef.title;
  const isFuture   = date > today;
  const isDone     = date < today;

  return (
    <div
      className="bg-surface rounded-lg border border-line p-3 mb-2 flex items-start gap-2.5 cursor-pointer"
      style={{ opacity: isFuture ? 0.55 : 1, cursor: isFuture ? "default" : "pointer" }}
      onClick={isFuture ? undefined : onOpen}
    >
      <div
        className="rounded px-1.5 py-0.5 text-[0.65rem] font-bold tracking-[0.04em] shrink-0 mt-0.5"
        style={{ background: hexToRgba(typeColor, 0.15), color: typeColor }}
      >
        {typeLabel}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-fg-muted text-[0.68rem] mb-0.5">
          {showDate
            ? `${formatDay(parseLocalDate(date))} · ${slot.timeStart}–${slot.timeEnd}`
            : `${slot.timeStart}–${slot.timeEnd}${slot.room ? ` · ${slot.room}` : ""}`}
        </div>
        <div className="text-accent text-[0.68rem] mb-[3px] font-medium">{slot.unitRef.title}</div>
        <div
          className="text-[0.85rem] font-medium leading-tight"
          style={{ color: isFuture ? "var(--c-text-muted)" : "var(--c-text-primary)" }}
        >
          {topic}
        </div>
        {slot.hasControl && !isFuture && (
          <div className="text-fg-muted text-[0.7rem] mt-1">{t("controlSection")}</div>
        )}
        {isFuture && (
          <div className="text-fg-dim text-[0.7rem] mt-1">{t("notAvailable")}</div>
        )}
      </div>
      {!isFuture && <div className="text-fg-dim text-xl leading-none shrink-0 self-center">›</div>}
      {isDone && <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1" />}
    </div>
  );
}
