import type { UnitLeaf, TrajectoryLesson } from "@eios/contracts";
import { BRSBlock, FinalControlChip } from "./PerformanceTab.js";
import { LESSON_TYPE_LABEL, LESSON_TYPE_COLOR } from "../../utils/grade.js";
import { hexToRgba } from "../../utils/color.js";
import { useLocale } from "../../locale.js";
import { SubHeader } from "../../shell/SubHeader.js";

interface Props {
  unit:     UnitLeaf;
  onBack:   () => void;
  onLesson: (lesson: TrajectoryLesson) => void;
}

export function UnitScreen({ unit, onBack, onLesson }: Props) {
  const { t } = useLocale();
  const isPractice = unit.unitType === "practice";

  return (
    <>
      <SubHeader title={unit.title} onBack={onBack} />

      <div className="flex-1 px-4 py-3 overflow-y-auto pt-4">
        {unit.brs.maxTotal > 0 && <BRSBlock brs={unit.brs} />}

        <div className="mb-4">
          <div className="text-fg-dim text-[0.68rem] font-bold uppercase tracking-[0.06em] mb-2">
            {t("finalControl")}
          </div>
          <div className="flex items-center gap-2">
            <FinalControlChip fc={unit.finalControl} />
          </div>
        </div>

        <div className="text-fg-dim text-[0.68rem] font-bold uppercase tracking-[0.06em] mb-2">
          {isPractice ? t("practiceAllDays") : t("allLessons")}
        </div>
        {unit.lessons.length === 0 ? (
          <div className="text-fg-dim text-center py-8 text-[0.85rem]">
            {t("noLessonsUnit")}
          </div>
        ) : (
          unit.lessons.map(lesson => (
            <LessonRow key={lesson.lessonId} lesson={lesson} onOpen={() => onLesson(lesson)} />
          ))
        )}
      </div>
    </>
  );
}

// ── LessonRow — строка занятия внутри дисциплины ─────────────────────────────
function LessonRow({ lesson, onOpen }: { lesson: TrajectoryLesson; onOpen: () => void }) {
  const typeColor = LESSON_TYPE_COLOR[lesson.lessonType];
  const typeLabel = LESSON_TYPE_LABEL[lesson.lessonType];
  const isFuture  = lesson.status === "future";
  const isDone    = lesson.status === "done";

  return (
    <button
      type="button"
      className={
        "w-full text-left bg-surface rounded-lg border border-line p-3 mb-2 " +
        "flex items-start gap-2.5 cursor-pointer min-h-[44px] " +
        "disabled:cursor-default disabled:opacity-55 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      }
      onClick={onOpen}
      disabled={isFuture}
      aria-label={`${typeLabel} №${lesson.sequenceNum}. ${lesson.topic}${isFuture ? ", ещё не доступно" : ""}${isDone ? ", пройдено" : ""}`}
    >
      <div
        className="rounded px-1.5 py-0.5 text-[0.65rem] font-bold tracking-[0.04em] shrink-0 mt-0.5"
        style={{ background: hexToRgba(typeColor, 0.15), color: typeColor }}
        aria-hidden="true"
      >
        {typeLabel}
      </div>
      <div className="flex-1 min-w-0" aria-hidden="true">
        <div className="text-[0.65rem] text-fg-muted mb-0.5">№{lesson.sequenceNum}</div>
        <div
          className="text-[0.85rem] font-medium leading-tight"
          style={{ color: isFuture ? "var(--c-text-muted)" : "var(--c-text-primary)" }}
        >
          {lesson.topic}
        </div>
        {isFuture && <div className="text-fg-dim text-[0.7rem] mt-1">Ещё не доступно</div>}
      </div>
      {!isFuture && <div className="text-fg-dim text-xl leading-none shrink-0 self-center" aria-hidden="true">›</div>}
      {isDone && <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1" aria-hidden="true" />}
    </button>
  );
}
