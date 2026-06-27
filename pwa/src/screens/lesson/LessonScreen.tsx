import { useState } from "react";
import type { CSSProperties } from "react";
import type { TrajectoryLesson, ScheduleSlot, AttendanceResult } from "@eios/contracts";
import { LESSON_TYPE_LABEL, LESSON_TYPE_COLOR } from "../../utils/grade.js";
import { hexToRgba } from "../../utils/color.js";
import { formatIsoDate } from "../../utils/date.js";
import { useLocale } from "../../locale.js";

interface Props {
  lesson:    TrajectoryLesson;
  slot:      ScheduleSlot | null;   // данные расписания (время, аудитория, педагог, рейтинг)
  slotDate:  string | null;         // ISO date "YYYY-MM-DD" из ScheduleDay
  unitTitle: string;                // название дисциплины/МДК для хлебной крошки
  onBack:    () => void;
  onLaunch?: () => void;
  onRatingSubmit?: (criteria: { id: string; value: boolean }[]) => void;
}

export function LessonScreen({ lesson, slot, slotDate, unitTitle, onBack, onLaunch, onRatingSubmit }: Props) {
  const { t } = useLocale();

  const ATT_INFO: Record<AttendanceResult, { icon: string; label: string; color: string }> = {
    "присутствовал":       { icon: "✓", label: t("present"),      color: "var(--c-success)" },
    "отсутствовал_уважит": { icon: "○", label: t("absentExcused"), color: "var(--c-accent)"  },
    "отсутствовал":        { icon: "✗", label: t("absent"),        color: "var(--c-danger)"  },
  };
  const typeColor = LESSON_TYPE_COLOR[lesson.lessonType];
  const typeLabel = LESSON_TYPE_LABEL[lesson.lessonType];

  // посещаемость: берём из первого события где она есть
  const attResult = lesson.events
    .flatMap(ev => ev.controls)
    .find(c => c.form === "посещаемость")?.result ?? null;

  // события без посещаемости (она вынесена отдельно)
  const displayEvents = lesson.events.map(ev => ({
    ...ev,
    controls: ev.controls.filter(c => c.form !== "посещаемость"),
  })).filter(ev => ev.controls.length > 0);

  // незакрытые обязательства
  const openObligations = lesson.events
    .flatMap(ev => ev.deferredObligations)
    .filter(o => o.status === "open" || o.status === "submitted");

  // рейтинг
  const ratingCriteria = slot?.rating?.criteria ?? null;
  const [ratings, setRatings] = useState<Record<string, boolean | null>>(
    () => ratingCriteria ? Object.fromEntries(ratingCriteria.map(c => [c.id, null])) : {},
  );
  const [ratingDone, setRatingDone] = useState(slot?.rating?.submitted ?? false);
  const allRated = ratingCriteria ? ratingCriteria.every(c => ratings[c.id] !== null) : false;

  function submitRating() {
    if (!ratingCriteria) return;
    onRatingSubmit?.(ratingCriteria.map(c => ({ id: c.id, value: ratings[c.id] as boolean })));
    setRatingDone(true);
  }

  const timeStr = slot && slotDate
    ? `${formatIsoDate(slotDate)} · ${slot.timeStart}–${slot.timeEnd}`
    : null;

  return (
    <>
      {/* Sub-шапка */}
      <div style={st.subHeader}>
        <button style={st.backBtn} onClick={onBack}>
          <span style={{ fontSize: 20 }}>‹</span> {t("back")}
        </button>
        <div style={st.subHeaderTitle}>{unitTitle}</div>
      </div>

      <div style={{ ...st.body, paddingTop: 16 }}>

        {/* Шапка занятия */}
        <div style={st.lessonHero}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ ...st.typeTag, background: hexToRgba(typeColor, 0.15), color: typeColor }}>
              {typeLabel}
            </span>
            {timeStr && <span style={st.lessonDate}>{timeStr}</span>}
            {slot?.room && <span style={st.lessonDate}>· {slot.room}</span>}
          </div>
          <div style={st.lessonTopic}>{lesson.topic}</div>
          {lesson.accessPolicy === "campus_only" && (
            <div style={st.campusNote}>{t("campusOnly")}</div>
          )}
        </div>

        {/* Кнопка запуска */}
        {lesson.status !== "future" && (
          <button
            style={{
              ...st.launchBtn,
              background: lesson.status === "done" ? "var(--c-card)" : "var(--c-accent)",
              color:      lesson.status === "done" ? "var(--c-text-secondary)" : "#fff",
              border:     lesson.status === "done" ? "1px solid var(--c-border)" : "none",
              marginBottom: 20,
              opacity: lesson.packageUrl ? 1 : 0.5,
              cursor:  lesson.packageUrl ? "pointer" : "not-allowed",
            }}
            onClick={lesson.packageUrl ? onLaunch : undefined}
          >
            {lesson.status === "done" ? t("openLessonAgain") : t("openLesson")}
          </button>
        )}

        {/* Педагог */}
        {slot?.teacher && (
          <div style={st.block}>
            <div style={st.blockLabel}>{t("teacherSection")}</div>
            <div style={st.teacherCard}>
              <div style={st.teacherName}>{slot.teacher.name}</div>
              <div style={st.teacherMeta}>
                {slot.teacher.position}{slot.teacher.degree ? ` · ${slot.teacher.degree}` : ""}
              </div>
            </div>
          </div>
        )}

        {/* Посещаемость */}
        <div style={st.block}>
          <div style={st.blockLabel}>{t("attendanceSection")}</div>
          {attResult ? (
            <div style={{ ...st.attChip, color: ATT_INFO[attResult].color, borderColor: ATT_INFO[attResult].color }}>
              <span>{ATT_INFO[attResult].icon}</span> {ATT_INFO[attResult].label}
            </div>
          ) : (
            <div style={{ ...st.attChip, color: "var(--c-text-dim)", borderColor: "var(--c-border)" }}>
              — {t("attPending")}
            </div>
          )}
        </div>

        {/* Задания (DeferredObligations) */}
        {openObligations.length > 0 && (
          <div style={st.block}>
            <div style={st.blockLabel}>{t("tasksSection")}</div>
            {openObligations.map(o => (
              <div key={o.obligationId} style={st.obligationRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={st.obligationLabel}>{o.label}</div>
                  {o.deadline && (
                    <div style={st.obligationDeadline}>до {formatIsoDate(o.deadline)}</div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600,
                    color: o.status === "submitted" ? "var(--c-accent)" : "var(--c-danger)" }}>
                    {o.status === "submitted" ? t("onReview") : t("notDone")}
                  </span>
                  {o.packageUrl && o.status === "open" && (
                    <button style={st.obligationBtn}>{t("doTask")}</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Контроль по событиям */}
        {displayEvents.length > 0 && (
          <div style={st.block}>
            <div style={st.blockLabel}>{t("controlSection")}</div>
            {displayEvents.map((ev, i) => (
              <div key={ev.eventId} style={{ ...st.eventBlock, marginTop: i > 0 ? 8 : 0 }}>
                {displayEvents.length > 1 && (
                  <div style={st.eventTypeLabel}>
                    {ev.kind === "модуль"    ? (ev.label ?? t("eventModule"))
                   : ev.kind === "аттестация" ? t("eventAttestation")
                   : t("eventLesson")}
                  </div>
                )}
                {ev.controls.map((ctrl, j) => (
                  <div key={j} style={st.ctrlRow}>
                    <span style={st.ctrlForm}>{ctrl.form}</span>
                    <span style={st.ctrlScore}>
                      {ctrl.score != null
                        ? <><span style={{ color: "var(--c-success)", fontWeight: 600 }}>{ctrl.score}</span>
                             <span style={{ color: "var(--c-text-muted)", fontSize: "0.7rem" }}>/{ctrl.maxScore}</span></>
                        : ctrl.maxScore
                          ? <span style={{ color: "var(--c-text-dim)" }}>— / {ctrl.maxScore}</span>
                          : <span style={{ color: "var(--c-text-dim)" }}>{t("awaitingResult")}</span>
                      }
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Оценить занятие */}
        {ratingCriteria && (
          <div style={st.block}>
            <div style={st.blockLabel}>{t("ratingSection")}</div>
            {ratingDone ? (
              <div style={st.ratingDone}>{t("ratingDone")}</div>
            ) : (
              <>
                {ratingCriteria.map(c => (
                  <div key={c.id} style={st.ratingRow}>
                    <span style={st.ratingCrit}>{c.label}</span>
                    <div style={st.ratingBtns}>
                      <button
                        style={{ ...st.ratingBtn, ...(ratings[c.id] === true  ? st.ratingYes : {}) }}
                        onClick={() => setRatings(r => ({ ...r, [c.id]: true }))}
                      >👍</button>
                      <button
                        style={{ ...st.ratingBtn, ...(ratings[c.id] === false ? st.ratingNo  : {}) }}
                        onClick={() => setRatings(r => ({ ...r, [c.id]: false }))}
                      >👎</button>
                    </div>
                  </div>
                ))}
                {allRated && (
                  <button style={st.ratingSubmit} onClick={submitRating}>
                    {t("submitRating")}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Стили ────────────────────────────────────────────────────────────────────
const st: Record<string, CSSProperties> = {
  subHeader:     { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--c-header)", borderBottom: "0.5px solid var(--c-border)", flexShrink: 0 },
  backBtn:       { background: "none", border: "none", color: "var(--c-accent)", fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  subHeaderTitle:{ color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  body:          { flex: 1, padding: "12px 16px", overflowY: "auto" },
  lessonHero:    { marginBottom: 16, paddingBottom: 16, borderBottom: "0.5px solid var(--c-border)" },
  typeTag:       { borderRadius: 4, padding: "2px 6px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0 },
  lessonDate:    { color: "var(--c-text-muted)", fontSize: "0.78rem" },
  lessonTopic:   { color: "var(--c-text-primary)", fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.35 },
  campusNote:    { color: "var(--c-text-muted)", fontSize: "0.72rem", marginTop: 6 },
  launchBtn:     { width: "100%", maxWidth: 320, border: "none", borderRadius: 10, fontSize: "0.95rem", fontWeight: 500, padding: "14px 20px" },
  block:         { marginBottom: 16 },
  blockLabel:    { color: "var(--c-text-dim)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 },
  teacherCard:   { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px 14px" },
  teacherName:   { color: "var(--c-text-primary)", fontSize: "0.88rem", fontWeight: 600 },
  teacherMeta:   { color: "var(--c-text-muted)", fontSize: "0.75rem", marginTop: 3 },
  attChip:       { display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 500, padding: "7px 12px", borderRadius: 8, border: "1px solid" },
  obligationRow: { display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", marginBottom: 6 },
  obligationLabel:   { color: "var(--c-text-primary)", fontSize: "0.85rem", fontWeight: 500 },
  obligationDeadline:{ color: "var(--c-danger)", fontSize: "0.73rem", marginTop: 2 },
  obligationBtn: { border: "none", background: "var(--c-accent)", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", cursor: "pointer" },
  eventBlock:    { background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "10px 14px" },
  eventTypeLabel:{ color: "var(--c-text-muted)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.03em", marginBottom: 8 },
  ctrlRow:       { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 6, paddingBottom: 2 },
  ctrlForm:      { color: "var(--c-text-secondary)", fontSize: "0.82rem" },
  ctrlScore:     { fontSize: "0.88rem", fontWeight: 600, flexShrink: 0 },
  ratingDone:    { color: "var(--c-success)", fontSize: "0.88rem", fontWeight: 500, textAlign: "center", padding: "12px 0" },
  ratingRow:     { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 0", borderBottom: "0.5px solid var(--c-border)" },
  ratingCrit:    { color: "var(--c-text-secondary)", fontSize: "0.83rem", flex: 1 },
  ratingBtns:    { display: "flex", gap: 6, flexShrink: 0 },
  ratingBtn:     { background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 8, width: 36, height: 36, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  ratingYes:     { borderColor: "var(--c-success)", background: "color-mix(in srgb, var(--c-success) 12%, transparent)" },
  ratingNo:      { borderColor: "var(--c-danger)",  background: "color-mix(in srgb, var(--c-danger)  12%, transparent)" },
  ratingSubmit:  { width: "100%", marginTop: 12, border: "none", borderRadius: 10, background: "var(--c-accent)", color: "#fff", fontSize: "0.88rem", fontWeight: 600, padding: "12px 0", cursor: "pointer" },
};
