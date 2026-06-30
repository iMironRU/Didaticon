import { useState } from "react";
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

const TYPE_TAG_CLS =
  "text-[0.6rem] font-bold tracking-[0.02em] px-1.5 py-0.5 rounded shrink-0";

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
      {/* Вкладки семестров */}
      <div className="flex gap-1 overflow-x-auto mb-3 pb-1">
        {semesters.map((s, i) => (
          <button
            key={s.period}
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

// ── ВО: записи без группировки ────────────────────────────────────────────────
function VoEntries({ semester, onBook }: { semester: GradebookSemester; onBook?: Props["onBookRetake"] }) {
  return (
    <div>
      {semester.entries.map(e => <EntryRow key={e.unitId} entry={e} onBook={onBook} />)}
    </div>
  );
}

// ── СПО: записи сгруппированы по ПМ ──────────────────────────────────────────
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
        <div key={g.code} className="mb-4 bg-surface rounded-xl border border-line overflow-hidden">
          <div className="flex items-baseline gap-2 px-3.5 py-2.5 bg-[color-mix(in_srgb,var(--c-accent)_8%,transparent)] border-b border-line">
            <span className="text-accent text-[0.72rem] font-bold tracking-[0.04em] shrink-0">{g.code}</span>
            <span className="text-fg text-[0.82rem] font-semibold leading-tight">{g.title}</span>
          </div>
          {g.entries.map(e => <EntryRow key={e.unitId} entry={e} onBook={onBook} />)}
        </div>
      ))}
      {noGroup.map(e => <EntryRow key={e.unitId} entry={e} onBook={onBook} />)}
    </div>
  );
}

// ── Строка записи ─────────────────────────────────────────────────────────────
function EntryRow({ entry, onBook }: { entry: GradebookEntry; onBook?: Props["onBookRetake"] }) {
  const { t } = useLocale();
  const fc = entry.finalControl;
  const [expanded, setExpanded] = useState(false);
  const expandable = fc.state === "failed_retake_scheduled";

  const rowClassName =
    "w-full text-left flex items-center gap-2 px-3.5 py-2.5 bg-surface rounded-lg border border-line mb-1.5 min-h-[44px] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
  const rowContent = (
    <>
      <div className={TYPE_TAG_CLS} style={fcChipStyle(fc.type)} aria-hidden="true">{fc.type}</div>
      <div className="flex-1 text-fg text-[0.82rem] leading-tight">
        {entry.code && (
          <span className="block text-accent text-[0.65rem] font-bold tracking-[0.03em] mb-px">
            {entry.code}
          </span>
        )}
        {entry.title}
      </div>
      <div className="text-fg-dim text-[0.7rem] shrink-0">{entry.credits} {t("creditsUnit")}</div>
      <GradeCell fc={fc} />
    </>
  );

  return (
    <>
      {expandable ? (
        <button
          type="button"
          className={`${rowClassName} cursor-pointer`}
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          {rowContent}
        </button>
      ) : (
        <div className={rowClassName}>{rowContent}</div>
      )}

      {expanded && fc.state === "failed_retake_scheduled" && (
        <div className="bg-[color-mix(in_srgb,var(--c-danger)_6%,transparent)] border border-danger rounded-lg px-3.5 py-2.5 -mt-1 mb-1.5">
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
                    className="border-0 bg-accent text-white rounded-md px-2.5 py-1 text-[0.72rem] cursor-pointer"
                    onClick={e => { e.stopPropagation(); onBook(entry, slot); }}
                  >
                    {t("book")}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}

// ── Ячейка оценки ─────────────────────────────────────────────────────────────
function GradeCell({ fc }: { fc: GradebookFinalControl }) {
  const { t } = useLocale();
  const baseCls = "text-[0.85rem] font-bold shrink-0 min-w-[40px] text-right";
  if (fc.state === "passed") {
    return (
      <div className={baseCls} style={{ color: gradeColor(fc.grade) }}>
        {fc.grade}
        {fc.grade100 != null && <span className="text-[0.6rem] font-normal text-fg-muted">/{fc.grade100}</span>}
      </div>
    );
  }
  if (fc.state === "in_progress") {
    return <div className={`${baseCls} text-fg-dim`}>—</div>;
  }
  if (fc.state === "failed_retake_scheduled") {
    return (
      <div className={`${baseCls} text-danger`}>
        {t("debt")} <span className="text-[0.6rem]">›</span>
      </div>
    );
  }
  if (fc.state === "failed_retake_pending") {
    return <div className={`${baseCls} text-danger`}>{t("debt")}</div>;
  }
  // failed_final
  return <div className={`${baseCls} text-danger`}>✗</div>;
}
