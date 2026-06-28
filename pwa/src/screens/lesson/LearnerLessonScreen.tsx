/**
 * LearnerLessonScreen — экран занятия для студента и родителя.
 *
 * readOnly=true для родителя — скрывает:
 *   - кнопку "Начать занятие" (parent не запускает SCORM ребёнка)
 *   - кнопки "Сделать задание" в обязательствах
 *   - блок оценки занятия (родитель не оценивает педагога)
 *
 * Всё остальное (информация, посещаемость, баллы) — видно.
 */
import { useState } from "react";
import type { TrajectoryLesson, ScheduleSlot, AttendanceResult } from "@eios/contracts";
import { formatIsoDate } from "../../utils/date.js";
import { useLocale } from "../../locale.js";
import { Card } from "../../ui/Card.js";
import { LessonHeader } from "./LessonHeader.js";
import { LessonHero } from "./LessonHero.js";

interface Props {
  lesson:    TrajectoryLesson;
  slot:      ScheduleSlot | null;
  slotDate:  string | null;
  unitTitle: string;
  onBack:    () => void;
  onLaunch?: () => void;
  onRatingSubmit?: (criteria: { id: string; value: boolean }[]) => void;
  /** Родитель — скрывает интерактивные элементы. */
  readOnly?: boolean;
}

const SECTION_LABEL_CLS =
  "text-fg-dim text-[0.68rem] font-bold uppercase tracking-[0.06em] mb-2";

export function LearnerLessonScreen({
  lesson, slot, slotDate, unitTitle, onBack, onLaunch, onRatingSubmit, readOnly,
}: Props) {
  const { t } = useLocale();

  const ATT_INFO: Record<AttendanceResult, { icon: string; label: string; cls: string }> = {
    "присутствовал":       { icon: "✓", label: t("present"),      cls: "text-success border-success" },
    "отсутствовал_уважит": { icon: "○", label: t("absentExcused"), cls: "text-accent  border-accent"  },
    "отсутствовал":        { icon: "✗", label: t("absent"),        cls: "text-danger  border-danger"  },
  };

  const attResult = lesson.events
    .flatMap(ev => ev.controls)
    .find(c => c.form === "посещаемость")?.result ?? null;

  const displayEvents = lesson.events.map(ev => ({
    ...ev,
    controls: ev.controls.filter(c => c.form !== "посещаемость"),
  })).filter(ev => ev.controls.length > 0);

  const openObligations = lesson.events
    .flatMap(ev => ev.deferredObligations)
    .filter(o => o.status === "open" || o.status === "submitted");

  const ratingCriteria = !readOnly ? (slot?.rating?.criteria ?? null) : null;
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
      <LessonHeader title={unitTitle} onBack={onBack} />

      <div className="flex-1 px-4 py-3 overflow-y-auto pt-4">
        <LessonHero
          type={lesson.lessonType}
          timeStr={timeStr}
          room={slot?.room}
          topic={lesson.topic}
          footer={lesson.accessPolicy === "campus_only"
            ? <div className="text-fg-muted text-[0.72rem]">{t("campusOnly")}</div>
            : null}
        />

        {/* Кнопка запуска (только если не parent + не future) */}
        {!readOnly && onLaunch && lesson.status !== "future" && (
          <button
            className={
              "w-full max-w-sm border-0 rounded-lg text-[0.95rem] font-medium py-3.5 mb-5 " +
              (lesson.status === "done"
                ? "bg-surface text-fg-secondary border border-line"
                : "bg-accent text-white") +
              (lesson.packageUrl ? " cursor-pointer" : " opacity-50 cursor-not-allowed")
            }
            onClick={lesson.packageUrl ? onLaunch : undefined}
          >
            {lesson.status === "done" ? t("openLessonAgain") : t("openLesson")}
          </button>
        )}

        {/* Педагог */}
        {slot?.teacher && (
          <div className="mb-4">
            <div className={SECTION_LABEL_CLS}>{t("teacherSection")}</div>
            <Card className="px-3.5 py-3">
              <div className="text-fg text-[0.88rem] font-semibold">{slot.teacher.name}</div>
              <div className="text-fg-muted text-xs mt-0.5">
                {slot.teacher.position}{slot.teacher.degree ? ` · ${slot.teacher.degree}` : ""}
              </div>
            </Card>
          </div>
        )}

        {/* Посещаемость */}
        <div className="mb-4">
          <div className={SECTION_LABEL_CLS}>{t("attendanceSection")}</div>
          {attResult ? (
            <div className={`inline-flex items-center gap-1.5 text-[0.82rem] font-medium px-3 py-1.5 rounded-lg border ${ATT_INFO[attResult].cls}`}>
              <span>{ATT_INFO[attResult].icon}</span> {ATT_INFO[attResult].label}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[0.82rem] font-medium px-3 py-1.5 rounded-lg border border-line text-fg-dim">
              — {t("attPending")}
            </div>
          )}
        </div>

        {/* Задания */}
        {openObligations.length > 0 && (
          <div className="mb-4">
            <div className={SECTION_LABEL_CLS}>{t("tasksSection")}</div>
            {openObligations.map(o => (
              <Card key={o.obligationId} className="flex items-start gap-2.5 px-3.5 py-2.5 mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="text-fg text-[0.85rem] font-medium">{o.label}</div>
                  {o.deadline && (
                    <div className="text-danger text-[0.73rem] mt-0.5">до {formatIsoDate(o.deadline)}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={
                    "text-xs font-semibold " +
                    (o.status === "submitted" ? "text-accent" : "text-danger")
                  }>
                    {o.status === "submitted" ? t("onReview") : t("notDone")}
                  </span>
                  {!readOnly && o.packageUrl && o.status === "open" && (
                    <button className="border-0 bg-accent text-white rounded-md px-2.5 py-1 text-xs cursor-pointer">
                      {t("doTask")}
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Контроль по событиям */}
        {displayEvents.length > 0 && (
          <div className="mb-4">
            <div className={SECTION_LABEL_CLS}>{t("controlSection")}</div>
            {displayEvents.map((ev, i) => (
              <Card key={ev.eventId} className={`px-3.5 py-2.5 ${i > 0 ? "mt-2" : ""}`}>
                {displayEvents.length > 1 && (
                  <div className="text-fg-muted text-[0.7rem] font-semibold tracking-[0.03em] mb-2">
                    {ev.kind === "модуль" ? (ev.label ?? t("eventModule"))
                      : ev.kind === "аттестация" ? t("eventAttestation")
                      : t("eventLesson")}
                  </div>
                )}
                {ev.controls.map((ctrl, j) => (
                  <div key={j} className="flex items-center justify-between gap-2 pt-1.5 pb-0.5">
                    <span className="text-fg-secondary text-[0.82rem]">{ctrl.form}</span>
                    <span className="text-[0.88rem] font-semibold shrink-0">
                      {ctrl.score != null ? (
                        <>
                          <span className="text-success font-semibold">{ctrl.score}</span>
                          <span className="text-fg-muted text-[0.7rem]">/{ctrl.maxScore}</span>
                        </>
                      ) : ctrl.maxScore ? (
                        <span className="text-fg-dim">— / {ctrl.maxScore}</span>
                      ) : (
                        <span className="text-fg-dim">{t("awaitingResult")}</span>
                      )}
                    </span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        )}

        {/* Оценить занятие — только студент, не родитель */}
        {ratingCriteria && (
          <div className="mb-4">
            <div className={SECTION_LABEL_CLS}>{t("ratingSection")}</div>
            {ratingDone ? (
              <div className="text-success text-[0.88rem] font-medium text-center py-3">
                {t("ratingDone")}
              </div>
            ) : (
              <>
                {ratingCriteria.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-b border-line">
                    <span className="text-fg-secondary text-[0.83rem] flex-1">{c.label}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        className={
                          "bg-surface border rounded-lg w-9 h-9 text-base cursor-pointer flex items-center justify-center " +
                          (ratings[c.id] === true
                            ? "border-success bg-[color-mix(in_srgb,var(--c-success)_12%,transparent)]"
                            : "border-line")
                        }
                        onClick={() => setRatings(r => ({ ...r, [c.id]: true }))}
                      >👍</button>
                      <button
                        className={
                          "bg-surface border rounded-lg w-9 h-9 text-base cursor-pointer flex items-center justify-center " +
                          (ratings[c.id] === false
                            ? "border-danger bg-[color-mix(in_srgb,var(--c-danger)_12%,transparent)]"
                            : "border-line")
                        }
                        onClick={() => setRatings(r => ({ ...r, [c.id]: false }))}
                      >👎</button>
                    </div>
                  </div>
                ))}
                {allRated && (
                  <button
                    className="w-full mt-3 border-0 rounded-lg bg-accent text-white text-[0.88rem] font-semibold py-3 cursor-pointer"
                    onClick={submitRating}
                  >
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
