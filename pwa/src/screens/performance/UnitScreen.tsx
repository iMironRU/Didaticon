import type { CSSProperties } from "react";
import type { UnitLeaf, TrajectoryLesson } from "@eios/contracts";
import { BRSBlock, FinalControlChip } from "./PerformanceTab.js";
import { LESSON_TYPE_LABEL, LESSON_TYPE_COLOR } from "../../utils/grade.js";
import { hexToRgba } from "../../utils/color.js";
import { useLocale } from "../../locale.js";

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
      <div style={st.subHeader}>
        <button style={st.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> {t("back")}
        </button>
        <div style={st.subHeaderTitle}>{unit.title}</div>
      </div>

      <div style={{ ...st.body, paddingTop: 16 }}>
        {/* БРС-блок */}
        {unit.brs.maxTotal > 0 && <BRSBlock brs={unit.brs} />}

        {/* Итоговый контроль */}
        <div style={st.block}>
          <div style={st.blockLabel}>{t("finalControl")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FinalControlChip fc={unit.finalControl} />
          </div>
        </div>

        {/* Занятия */}
        <div style={st.blockLabel}>
          {isPractice ? t("practiceAllDays") : t("allLessons")}
        </div>
        {unit.lessons.length === 0 ? (
          <div style={st.empty}>{t("noLessonsUnit")}</div>
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
  const typeColor  = LESSON_TYPE_COLOR[lesson.lessonType];
  const typeLabel  = LESSON_TYPE_LABEL[lesson.lessonType];
  const isFuture   = lesson.status === "future";
  const isDone     = lesson.status === "done";

  return (
    <div
      style={{ ...st.card, opacity: isFuture ? 0.55 : 1 }}
      onClick={isFuture ? undefined : onOpen}
    >
      <div style={{ ...st.typeTag, background: hexToRgba(typeColor, 0.15), color: typeColor }}>
        {typeLabel}
      </div>
      <div style={st.cardBody}>
        <div style={{ fontSize: "0.65rem", color: "var(--c-text-muted)", marginBottom: 2 }}>
          №{lesson.sequenceNum}
        </div>
        <div style={{ ...st.cardTopic, color: isFuture ? "var(--c-text-muted)" : "var(--c-text-primary)" }}>
          {lesson.topic}
        </div>
        {isFuture && <div style={st.locked}>Ещё не доступно</div>}
      </div>
      {!isFuture && <div style={st.chevron}>›</div>}
      {isDone && <div style={st.doneDot} />}
    </div>
  );
}

// ── Стили ─────────────────────────────────────────────────────────────────────
const st: Record<string, CSSProperties> = {
  subHeader:    { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--c-header)", borderBottom: "0.5px solid var(--c-border)", flexShrink: 0 },
  backBtn:      { background: "none", border: "none", color: "var(--c-accent)", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  subHeaderTitle: { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  body:         { flex: 1, padding: "12px 16px", overflowY: "auto" },
  block:        { marginBottom: 16 },
  blockLabel:   { color: "var(--c-text-dim)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 },
  empty:        { color: "var(--c-text-dim)", textAlign: "center" as const, padding: "32px 0", fontSize: "0.85rem" },
  card:         { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px", marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" },
  typeTag:      { borderRadius: 4, padding: "2px 6px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0, marginTop: 2 },
  cardBody:     { flex: 1, minWidth: 0 },
  cardTopic:    { fontSize: "0.85rem", fontWeight: 500, lineHeight: 1.3 },
  locked:       { color: "var(--c-text-dim)", fontSize: "0.7rem", marginTop: 4 },
  chevron:      { color: "var(--c-text-dim)", fontSize: "1.2rem", lineHeight: 1, flexShrink: 0, alignSelf: "center" },
  doneDot:      { width: 6, height: 6, borderRadius: "50%", background: "var(--c-success)", flexShrink: 0, marginTop: 4 },
};
