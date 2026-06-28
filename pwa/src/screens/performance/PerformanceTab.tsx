/**
 * PerformanceTab — список дисциплин / ПМ текущего семестра.
 *
 * Экспортирует UnitCard, GroupCard, FinalControlChip, BRSBlock — переиспользуются
 * в UnitScreen и GroupScreen.
 */
import type { Learner, UnitLeaf, UnitGroup, PlannedControl, BRS } from "@eios/contracts";
import { fcChipStyle } from "../../utils/color.js";
import { useLocale } from "../../locale.js";
import { progressColor } from "../../utils/grade.js";

interface Props {
  learner: Learner;
  onUnit:  (unit: UnitLeaf)   => void;
  onGroup: (group: UnitGroup) => void;
}

export function PerformanceTab({ learner, onUnit, onGroup }: Props) {
  const isGroupMode = learner.units.some(u => u.kind === "group");

  return (
    <div>
      {isGroupMode
        ? learner.units
            .filter((u): u is UnitGroup => u.kind === "group")
            .map(g => <GroupCard key={g.unitId} group={g} onClick={() => onGroup(g)} />)
        : learner.units
            .filter((u): u is UnitLeaf => u.kind === "unit")
            .map(u => <UnitCard key={u.unitId} unit={u} onClick={() => onUnit(u)} />)
      }
    </div>
  );
}

// ── UnitCard — карточка дисциплины / МДК / практики ──────────────────────────
interface UnitCardProps {
  unit:    UnitLeaf;
  onClick: () => void;
  showCode?: boolean;  // в контексте ПМ показывать код (МДК.01.01)
}

export function UnitCard({ unit, onClick, showCode = false }: UnitCardProps) {
  const { t } = useLocale();
  const isPractice = unit.unitType === "practice";
  const counts = unit.lessonCounts;
  const totalLessons = isPractice
    ? (counts as { days: number }).days
    : (counts as { lec: number; prac: number; lab: number }).lec
      + (counts as { lec: number; prac: number; lab: number }).prac
      + (counts as { lec: number; prac: number; lab: number }).lab;
  const doneLessons = unit.lessons.filter(l => l.status === "done").length;
  const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
  const brsTotal = unit.brs.total;
  const brsMax   = unit.brs.maxTotal;

  return (
    <button
      className="w-full bg-surface rounded-lg border border-line px-3.5 py-3 mb-2 cursor-pointer text-left"
      onClick={onClick}
    >
      {showCode && (
        <div className="text-accent text-[0.68rem] font-bold tracking-[0.04em] mb-0.5">
          {unit.code}
        </div>
      )}
      <div
        className="flex items-center justify-between gap-2"
        style={{ marginBottom: unit.dept ? 2 : 8 }}
      >
        <span className="text-fg text-[0.88rem] font-medium">{unit.title}</span>
        {brsMax > 0 && (
          <span className="text-[0.82rem] font-bold text-accent shrink-0">
            {brsTotal}<span className="text-[0.68rem] font-normal text-fg-muted"> / {brsMax} б.</span>
          </span>
        )}
      </div>
      {unit.dept && <div className="text-fg-muted text-[0.7rem] mt-px mb-1">{unit.dept.name}</div>}
      <div className="h-0.5 bg-track rounded-sm my-2 mb-2.5">
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: progressColor(pct) }} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-fg-secondary text-[0.72rem] font-medium">
          {isPractice
            ? `${(counts as { days: number }).days} ${t("practiceDays")}`
            : [
                (counts as { lec: number }).lec   ? `${(counts as { lec: number }).lec} ${t("lec")}`   : null,
                (counts as { prac: number }).prac ? `${(counts as { prac: number }).prac} ${t("prac")}` : null,
                (counts as { lab: number }).lab   ? `${(counts as { lab: number }).lab} ${t("lab")}`   : null,
              ].filter(Boolean).join(" · ")
          }
        </div>
        <FinalControlChip fc={unit.finalControl} />
      </div>
    </button>
  );
}

// ── GroupCard — карточка ПМ (СПО) ────────────────────────────────────────────
interface GroupCardProps {
  group:   UnitGroup;
  onClick: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const allLessons = group.children.flatMap(c => c.lessons);
  const done       = allLessons.filter(l => l.status === "done").length;
  const total      = allLessons.length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <button
      className="w-full bg-surface rounded-xl border border-line px-4 py-3.5 mb-2.5 cursor-pointer text-left"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-accent text-[0.68rem] font-bold tracking-[0.04em] mb-0.5">
            {group.code}
          </div>
          <span className="text-fg text-[0.88rem] font-medium">{group.title}</span>
        </div>
      </div>
      {group.dept && <div className="text-fg-muted text-[0.7rem] mt-px mb-1">{group.dept.name}</div>}
      <div className="h-0.5 bg-track rounded-sm my-2 mb-2.5">
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: progressColor(pct) }} />
      </div>
      <div className="flex items-end justify-end gap-2">
        <FinalControlChip fc={group.finalControl} />
      </div>
    </button>
  );
}

// ── FinalControlChip ──────────────────────────────────────────────────────────
export function FinalControlChip({ fc }: { fc: PlannedControl }) {
  const { t } = useLocale();
  const confirmed = fc.date?.confirmed ?? false;
  const dateStr   = fc.date?.value;
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className="text-[0.62rem] font-bold tracking-[0.02em] px-1.5 py-0.5 rounded"
        style={fcChipStyle(fc.type)}
      >
        {fc.type}
      </span>
      {dateStr && (
        confirmed
          ? <div className="text-[0.67rem] text-fg-secondary">{dateStr}</div>
          : <div className="text-[0.67rem] text-fg-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full border-[1.5px] border-current inline-block shrink-0" />
              ~ {dateStr}
              <span className="text-[0.58rem] text-fg-dim">{t("planned")}</span>
            </div>
      )}
    </div>
  );
}

// ── BRSBlock — детализация БРС ────────────────────────────────────────────────
export function BRSBlock({ brs }: { brs: BRS }) {
  const totalPct = brs.maxTotal > 0 ? Math.round((brs.total / brs.maxTotal) * 100) : 0;
  return (
    <div className="bg-surface rounded-xl border border-line px-4 py-3.5 mb-4">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-fg-dim text-[0.68rem] font-bold tracking-[0.06em] uppercase shrink-0">БРС</span>
        <div className="flex-1 h-0.5 bg-track rounded-sm">
          <div className="h-full rounded-sm" style={{ width: `${totalPct}%`, background: progressColor(totalPct) }} />
        </div>
        <span className="text-fg text-[0.88rem] font-bold shrink-0">
          {brs.total} <span className="text-[0.68rem] font-normal text-fg-muted">/ {brs.maxTotal} б.</span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {brs.breakdown.map((item, i) => {
          const pct  = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0;
          const zero = item.score === 0;
          return (
            <div key={i} className="pt-2.5 border-t border-line">
              <div className="flex items-center justify-between gap-2">
                <span className={"text-[0.82rem] " + (zero ? "text-fg-dim" : "text-fg-secondary")}>
                  {item.label}
                </span>
                <span className="text-[0.85rem] shrink-0">
                  {zero
                    ? <span className="text-fg-dim">— / {item.max}{item.unit ? ` ${item.unit}` : ""}</span>
                    : <>
                        <span className="text-accent font-bold">{item.score}</span>
                        <span className="text-fg-muted text-[0.7rem]"> / {item.max}{item.unit ? ` ${item.unit}` : ""}</span>
                      </>
                  }
                </span>
              </div>
              <div className="h-0.5 bg-track rounded-sm mt-1">
                {!zero && <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: progressColor(pct) }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
