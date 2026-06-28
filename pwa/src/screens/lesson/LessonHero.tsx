/**
 * LessonHero — шапка занятия (тип-бейдж + дата/время/аудитория + тема).
 * Используется обоими — student/parent и teacher.
 */
import type { ReactNode } from "react";
import type { LessonType } from "@eios/contracts";
import { LESSON_TYPE_LABEL, LESSON_TYPE_COLOR } from "../../utils/grade.js";
import { hexToRgba } from "../../utils/color.js";

interface Props {
  type:     LessonType;
  /** Сборная строка с датой/временем, например "1 июл · 09:00–10:30" */
  timeStr?: string | null;
  room?:    string | null;
  topic:    string;
  /** Доп. блок под темой (например, "доступ только в кампусе") */
  footer?:  ReactNode;
}

export function LessonHero({ type, timeStr, room, topic, footer }: Props) {
  const color = LESSON_TYPE_COLOR[type];
  const label = LESSON_TYPE_LABEL[type];
  return (
    <div className="mb-4 pb-4 border-b border-line">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="rounded px-1.5 py-0.5 text-[0.65rem] font-bold tracking-[0.04em] shrink-0"
          style={{ background: hexToRgba(color, 0.15), color }}
        >
          {label}
        </span>
        {timeStr && <span className="text-fg-muted text-[0.78rem]">{timeStr}</span>}
        {room && <span className="text-fg-muted text-[0.78rem]">· {room}</span>}
      </div>
      <div className="text-fg text-[1.05rem] font-semibold leading-snug">{topic}</div>
      {footer && <div className="mt-1.5">{footer}</div>}
    </div>
  );
}
