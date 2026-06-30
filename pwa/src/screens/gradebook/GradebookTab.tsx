import { Fragment, useState } from "react";
import type {
  GradebookResponse, GradebookSemester, GradebookEntry, GradebookFinalControl, BookingSlot,
} from "@eios/contracts";
import { gradeColor } from "../../utils/grade.js";
import { useLocale, type StringKey } from "../../locale.js";
import { fcChipStyle } from "../../utils/color.js";
import { formatIsoDate, ROMAN } from "../../utils/date.js";

interface Props {
  gradebook:    GradebookResponse;
  onBookRetake?: (entry: GradebookEntry, slot: BookingSlot) => void;
}

/* Зачётная книжка — семантически таблица (a11y политика §5.14 LMS-таблицы).
 * Каждая строка = <tr> с <th scope="row"> для дисциплины, <td> для типа /
 * часов / оценки. Скринридер навигирует по столбцам/строкам стандартными
 * горячими клавишами, объявляет заголовок столбца + строки в каждой ячейке.
 *
 * Стиль остаётся card-like: border-collapse: separate + border-spacing
 * даёт зазор между строками; bg/border/rounded на <tr> через цельные ячейки. */
const TYPE_TAG_CLS =
  "text-[0.6rem] font-bold tracking-[0.02em] px-1.5 py-0.5 rounded shrink-0 inline-block lesson-type-chip";

export function GradebookTab({ gradebook, onBookRetake }: Props) {
  const { t } = useLocale();
  const semesters  = gradebook.semesters;
  const currentIdx = semesters.findIndex(s => s.isCurrent);
  const [selIdx, setSelIdx] = useState(currentIdx >= 0 ? currentIdx : semesters.length - 1);
  const sem = semesters[selIdx];
  if (!sem) return <div className="text-fg-dim text-center py-8 text-[0.85rem]">{t("dataUnavailable")}</div>;

  const isSpO = sem.entries.some(e => e.groupCode);

  return (
    <div>
      {/* Вкладки семестров — это переключатель, не таблица. */}
      <div className="flex gap-1 overflow-x-auto mb-3 pb-1" role="tablist" aria-label={t("semester")}>
        {semesters.map((s, i) => (
          <button
            key={s.period}
            role="tab"
            aria-selected={i === selIdx}
            className={
              "shrink-0 rounded-md text-[0.72rem] font-medium px-2.5 py-1.5 cursor-pointer whitespace-nowrap " +
              (i === selIdx
                ? "bg-accent border border-accent text-white"
                : "bg-transparent border border-line text-fg-muted")
            }
            onClick={() => setSelIdx(i)}
          >
            {semShort(s, i + 1, t)}
          </button>
        ))}
      </div>

      <div className="text-fg-muted text-[0.68rem] tracking-[0.08em] uppercase mb-2.5 font-semibold">
        {sem.label}
      </div>

      {isSpO
        ? <SpOGroupedEntries semester={sem} onBook={onBookRetake} />
        : <VoEntries          semester={sem} onBook={onBookRetake} />
      }
    </div>
  );
}

function semShort(s: GradebookSemester, n: number, t: (k: StringKey) => string): string {
  return s.isCurrent ? t("currentSemester") : `${ROMAN[Math.floor((n - 1) / 2)] ?? n}к · ${n % 2 === 0 ? t("spring") : t("autumn")}`;
}

// ── Каркас таблицы (shared между ВО и СПО) ───────────────────────────────────
function EntriesTable({
  caption, entries, onBook,
}: { caption: string; entries: GradebookEntry[]; onBook?: Props["onBookRetake"] }) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 0.375rem" }}>
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{t("controlType")}</th>
          <th scope="col">{t("discipline")}</th>
          <th scope="col">{t("credits")}</th>
          <th scope="col">{t("grade")}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(e => (
          <EntryTr key={e.unitId} entry={e} expanded={expanded.has(e.unitId)} onToggle={() => toggle(e.unitId)} onBook={onBook} />
        ))}
      </tbody>
    </table>
  );
}

// ── ВО: записи без группировки ───────────────────────────────────────────────
function VoEntries({ semester, onBook }: { semester: GradebookSemester; onBook?: Props["onBookRetake"] }) {
  return <EntriesTable caption={semester.label} entries={semester.entries} onBook={onBook} />;
}

// ── СПО: записи сгруппированы по ПМ. Каждый ПМ — отдельная таблица ───────────
function SpOGroupedEntries({ semester, onBook }: { semester: GradebookSemester; onBook?: Props["onBookRetake"] }) {
  type PMGroup = { code: string; title: string; entries: GradebookEntry[] };
  const groups: PMGroup[] = [];
  const noGroup: GradebookEntry[] = [];

  for (const e of semester.entries) {
    if (e.groupCode && e.groupTitle) {
      let g = groups.find(g => g.code === e.groupCode);
      if (!g) { g = { code: e.groupCode, title: e.groupTitle, entries: [] }; groups.push(g); }
      g.entries.push(e);
    } else {
      noGroup.push(e);
    }
  }

  return (
    <div>
      {groups.map(g => (
        <div key={g.code} className="mb-4">
          <div className="flex items-baseline gap-2 px-3.5 py-2.5 rounded-t-xl bg-[color-mix(in_srgb,var(--c-accent)_8%,transparent)] border border-line">
            <span className="text-accent text-[0.72rem] font-bold tracking-[0.04em] shrink-0">{g.code}</span>
            <span className="text-fg text-[0.82rem] font-semibold leading-tight">{g.title}</span>
          </div>
          <EntriesTable caption={`${g.code} ${g.title}`} entries={g.entries} onBook={onBook} />
        </div>
      ))}
      {noGroup.length > 0 && (
        <EntriesTable caption={semester.label} entries={noGroup} onBook={onBook} />
      )}
    </div>
  );
}

// ── Строка зачётки + опциональная expandable строка пересдачи ────────────────
function EntryTr({
  entry, expanded, onToggle, onBook,
}: { entry: GradebookEntry; expanded: boolean; onToggle: () => void; onBook?: Props["onBookRetake"] }) {
  const { t } = useLocale();
  const fc = entry.finalControl;
  const expandable = fc.state === "failed_retake_scheduled";

  const cellCls = "bg-surface px-3 py-2.5 border-y border-line first:border-l first:rounded-l-lg first:pl-3.5 last:border-r last:rounded-r-lg last:pr-3.5 align-middle";

  return (
    <Fragment>
      <tr>
        <td className={cellCls + " w-0 whitespace-nowrap"}>
          <span className={TYPE_TAG_CLS} style={fcChipStyle(fc.type)} aria-hidden="true">{fc.type}</span>
          <span className="sr-only">{fc.type}</span>
        </td>
        <th scope="row" className={cellCls + " font-normal text-left"}>
          {expandable ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              className="block w-full text-left bg-transparent border-0 cursor-pointer p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              {entry.code && (
                <span className="block text-accent text-[0.65rem] font-bold tracking-[0.03em] mb-px">
                  {entry.code}
                </span>
              )}
              <span className="text-fg text-[0.82rem] leading-tight">
                {entry.title}
                <span className="text-fg-muted ml-1" aria-hidden="true">{expanded ? "▾" : "›"}</span>
              </span>
            </button>
          ) : (
            <>
              {entry.code && (
                <span className="block text-accent text-[0.65rem] font-bold tracking-[0.03em] mb-px">
                  {entry.code}
                </span>
              )}
              <span className="text-fg text-[0.82rem] leading-tight">{entry.title}</span>
            </>
          )}
        </th>
        <td className={cellCls + " text-fg-muted text-[0.7rem] whitespace-nowrap text-right w-0"}>
          {entry.credits} {t("creditsUnit")}
        </td>
        <td className={cellCls + " text-right w-0"}>
          <GradeCell fc={fc} />
        </td>
      </tr>

      {expandable && expanded && (
        <tr>
          <td
            colSpan={4}
            className="bg-[color-mix(in_srgb,var(--c-danger)_6%,transparent)] border border-danger rounded-lg px-3.5 py-2.5"
          >
            <div className="text-danger text-[0.72rem] font-semibold mb-2">
              {t("retakeNum")}{fc.attemptNumber}{fc.isCommission ? ` ${t("commission")}` : ""}
              {" · "}{formatIsoDate(fc.retakeDate)}
            </div>
            {fc.availableSlots.length === 0 ? (
              <div className="text-fg-dim text-[0.78rem]">{t("noSlots")}</div>
            ) : (
              fc.availableSlots.map(slot => (
                <div key={slot.bookingSlotId} className="flex items-center gap-2 py-1.5 border-t border-line">
                  <span className="flex-1 text-fg-secondary text-[0.8rem]">
                    {slot.timeStart}–{slot.timeEnd}{slot.room ? ` · ${slot.room}` : ""}
                  </span>
                  <span className="text-fg-muted text-[0.72rem]">
                    {slot.availableSpots} {t("spots")}
                  </span>
                  {onBook && slot.availableSpots > 0 && (
                    <button
                      type="button"
                      className="border-0 bg-accent text-white rounded-md px-2.5 py-1 text-[0.72rem] cursor-pointer min-h-[44px]"
                      onClick={() => onBook(entry, slot)}
                    >
                      {t("book")}
                    </button>
                  )}
                </div>
              ))
            )}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

// ── Ячейка оценки ────────────────────────────────────────────────────────────
function GradeCell({ fc }: { fc: GradebookFinalControl }) {
  const { t } = useLocale();
  const baseCls = "text-[0.85rem] font-bold inline-block min-w-[40px] text-right";
  if (fc.state === "passed") {
    return (
      <span className={baseCls} style={{ color: gradeColor(fc.grade) }}>
        {fc.grade}
        {fc.grade100 != null && <span className="text-[0.6rem] font-normal text-fg-muted">/{fc.grade100}</span>}
      </span>
    );
  }
  if (fc.state === "in_progress") {
    return <span className={`${baseCls} text-fg-dim`} aria-label={t("inProgress")}>—</span>;
  }
  if (fc.state === "failed_retake_scheduled") {
    return (
      <span className={`${baseCls} text-danger`} aria-label={`${t("debt")}, ${t("retakeScheduled")}`}>
        {t("debt")} <span className="text-[0.6rem]" aria-hidden="true">›</span>
      </span>
    );
  }
  if (fc.state === "failed_retake_pending") {
    return <span className={`${baseCls} text-danger`}>{t("debt")}</span>;
  }
  // failed_final
  return <span className={`${baseCls} text-danger`} aria-label={t("failed")}>✗</span>;
}
