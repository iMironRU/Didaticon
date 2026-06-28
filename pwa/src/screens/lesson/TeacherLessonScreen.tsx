/**
 * TeacherLessonScreen — экран занятия для педагога.
 *
 * Сценарий: открыть → "Начать занятие" → отметить отсутствующих → "Сохранить".
 * После сохранения данные пойдут в outbox glue для свидетельства.
 */
import { useState } from "react";
import type { TeacherScheduleSlot, AttendanceStudent } from "@eios/contracts";
import { LessonHeader } from "./LessonHeader.js";
import { LessonHero } from "./LessonHero.js";
import { Card } from "../../ui/Card.js";

interface Props {
  slot:     TeacherScheduleSlot;
  date:     string;
  students: AttendanceStudent[];
  onBack:   () => void;
}

const LESSON_KIND_TO_TYPE: Record<string, "лекция" | "практика" | "лаб" | "день_практики"> = {
  "Лекция":   "лекция",
  "Практика": "практика",
  "Лаб":      "лаб",
};

function fmtDate(d: string): string {
  const [y, m, dd] = d.split("-");
  return `${dd}.${m}.${y}`;
}

export function TeacherLessonScreen({ slot, date, students: initialStudents, onBack }: Props) {
  const [started, setStarted] = useState(slot.status === "in_progress");
  const [absent, setAbsent]   = useState<Set<string>>(new Set());
  const [saved, setSaved]     = useState(false);

  const groupStr = slot.groups.map(g => g.title).join(", ");
  const lessonType = LESSON_KIND_TO_TYPE[slot.lessonKind] ?? "лекция";

  function toggleAbsent(id: string) {
    setSaved(false);
    setAbsent(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function markAll()  { setSaved(false); setAbsent(new Set(initialStudents.map(s => s.studentId))); }
  function clearAll() { setSaved(false); setAbsent(new Set()); }
  function invert()   { setSaved(false); setAbsent(new Set(initialStudents.filter(s => !absent.has(s.studentId)).map(s => s.studentId))); }

  return (
    <>
      <LessonHeader title={`${slot.lessonKind} · ${slot.unitRef.title}`} onBack={onBack} />

      <div className="flex-1 px-4 py-3 overflow-y-auto pt-4 flex flex-col gap-4">
        <LessonHero
          type={lessonType}
          timeStr={`${fmtDate(date)} · ${slot.timeStart}–${slot.timeEnd}`}
          room={slot.room}
          topic={slot.unitRef.title}
        />

        {/* Старт */}
        {!started ? (
          <button
            className="w-full bg-accent border-0 rounded-xl py-4 text-base font-semibold text-white cursor-pointer"
            onClick={() => setStarted(true)}
          >
            ▶ Начать занятие
          </button>
        ) : (
          <div className="bg-[rgba(52,199,89,.15)] text-[#34C759] rounded-lg px-4 py-2.5 text-[0.88rem] font-semibold text-center">
            ● Занятие идёт
          </div>
        )}

        {/* Посещаемость */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[0.82rem] text-fg-muted font-semibold uppercase tracking-[0.04em]">
              {groupStr} · {initialStudents.length} чел.
            </span>
            {absent.size > 0 && (
              <span className="text-[0.78rem] text-danger font-semibold">
                отсутствует: {absent.size}
              </span>
            )}
          </div>

          <div className="flex gap-1.5 mb-2.5">
            <button className="flex-1 bg-surface border border-line rounded-lg px-1 py-1.5 text-[0.68rem] text-fg-muted cursor-pointer" onClick={markAll}>Отметить всех</button>
            <button className="flex-1 bg-surface border border-line rounded-lg px-1 py-1.5 text-[0.68rem] text-fg-muted cursor-pointer" onClick={clearAll}>Снять все</button>
            <button className="flex-1 bg-surface border border-line rounded-lg px-1 py-1.5 text-[0.68rem] text-fg-muted cursor-pointer" onClick={invert}>Инвертировать</button>
          </div>

          <div className="flex flex-col gap-px mb-3">
            {initialStudents.map(st => {
              const isAbsent = absent.has(st.studentId);
              return (
                <div
                  key={st.studentId}
                  className={
                    "flex items-center gap-2.5 px-2 py-2.5 rounded-lg cursor-pointer " +
                    (isAbsent ? "bg-[rgba(255,59,48,.06)]" : "")
                  }
                  onClick={() => toggleAbsent(st.studentId)}
                >
                  <span className={"text-[0.9rem] w-4 text-center shrink-0 " + (isAbsent ? "text-danger" : "text-fg-dim")}>
                    {isAbsent ? "●" : "○"}
                  </span>
                  <span className="text-[0.88rem] text-fg">{st.name}</span>
                </div>
              );
            })}
          </div>

          <button
            className={
              "w-full border-0 rounded-lg py-3 text-[0.9rem] font-semibold text-white cursor-pointer " +
              (saved ? "bg-[#34C759]" : "bg-accent")
            }
            onClick={() => setSaved(true)}
          >
            {saved
              ? "✓ Сохранено"
              : `Сохранить · ${absent.size > 0 ? absent.size + " отсутств." : "все присутствуют"}`}
          </button>
        </Card>

        {/* Задания */}
        <Card className="p-3.5">
          <div className="text-[0.82rem] text-fg-muted font-semibold uppercase tracking-[0.04em] mb-2">
            Задания
          </div>
          <button className="w-full bg-surface border border-line rounded-lg py-3 text-[0.88rem] text-fg cursor-pointer">
            📋 Очередь проверки
          </button>
        </Card>
      </div>
    </>
  );
}
