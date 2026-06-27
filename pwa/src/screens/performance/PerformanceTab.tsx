import type { CSSProperties } from "react";
import type { Learner, UnitLeaf, UnitGroup, CurriculumUnit, PlannedControl, BRS } from "@eios/contracts";
import { fcChipStyle } from "../../utils/color.js";
import { useLocale } from "../../locale.js";
import { progressColor } from "../../utils/grade.js";

interface Props {
  learner:  Learner;
  onUnit:   (unit: UnitLeaf)  => void;
  onGroup:  (group: UnitGroup) => void;
}

// PerformanceTab — список дисциплин / ПМ текущего семестра ────────────────────
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

// ── UnitCard — карточка дисциплины / МДК / практики ───────────────────────────
interface UnitCardProps {
  unit:    UnitLeaf;
  onClick: () => void;
  showCode?: boolean; // в контексте ПМ показывать код (МДК.01.01)
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
    <button style={st.card} onClick={onClick}>
      {showCode && <div style={st.unitCode}>{unit.code}</div>}
      <div style={{ ...st.head, marginBottom: unit.dept ? 2 : 8 }}>
        <span style={st.unitTitle}>{unit.title}</span>
        {brsMax > 0 && (
          <span style={st.brsBadge}>
            {brsTotal}<span style={st.brsMax}> / {brsMax} б.</span>
          </span>
        )}
      </div>
      {unit.dept && <div style={st.dept}>{unit.dept.name}</div>}
      <div style={{ ...st.bar, margin: "8px 0 10px" }}>
        <div style={{ ...st.fill, width: `${pct}%`, background: progressColor(pct) }} />
      </div>
      <div style={st.footer}>
        <div style={st.lc}>
          {isPractice
            ? `${(counts as { days: number }).days} ${t("practiceDays")}`
            : [
                (counts as { lec: number }).lec  ? `${(counts as { lec: number }).lec} ${t("lec")}`  : null,
                (counts as { prac: number }).prac ? `${(counts as { prac: number }).prac} ${t("prac")}` : null,
                (counts as { lab: number }).lab   ? `${(counts as { lab: number }).lab} ${t("lab")}`  : null,
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
    <button style={st.pmCard} onClick={onClick}>
      <div style={st.head}>
        <div style={{ minWidth: 0 }}>
          <div style={st.unitCode}>{group.code}</div>
          <span style={st.unitTitle}>{group.title}</span>
        </div>
      </div>
      {group.dept && <div style={st.dept}>{group.dept.name}</div>}
      <div style={{ ...st.bar, margin: "8px 0 10px" }}>
        <div style={{ ...st.fill, width: `${pct}%`, background: progressColor(pct) }} />
      </div>
      <div style={{ ...st.footer, justifyContent: "flex-end" }}>
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
    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 2 }}>
      <span style={{ ...st.fcChip, ...fcChipStyle(fc.type) }}>{fc.type}</span>
      {dateStr && (
        <div style={confirmed ? st.fcDate : st.fcDatePlan}>
          {!confirmed && <span style={st.fcPlanDot} />}
          {!confirmed && "~ "}{dateStr}
          {!confirmed && <span style={st.fcPlanLabel}>{t("planned")}</span>}
        </div>
      )}
    </div>
  );
}

// ── BRSBlock — детализация БРС ────────────────────────────────────────────────
export function BRSBlock({ brs }: { brs: BRS }) {
  const totalPct = brs.maxTotal > 0 ? Math.round((brs.total / brs.maxTotal) * 100) : 0;
  return (
    <div style={st.brsBlock}>
      <div style={st.brsTotalRow}>
        <span style={st.brsTotalLabel}>БРС</span>
        <div style={{ ...st.bar, flex: 1 }}>
          <div style={{ ...st.fill, width: `${totalPct}%`, background: progressColor(totalPct) }} />
        </div>
        <span style={st.brsTotalScore}>
          {brs.total} <span style={st.brsMax}>/ {brs.maxTotal} б.</span>
        </span>
      </div>
      <div style={st.brsGrid}>
        {brs.breakdown.map((item, i) => {
          const pct  = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0;
          const zero = item.score === 0;
          return (
            <div key={i} style={st.brsGridItem}>
              <div style={st.brsItemRow}>
                <span style={{ ...st.brsItemLabel, color: zero ? "var(--c-text-dim)" : "var(--c-text-secondary)" }}>
                  {item.label}
                </span>
                <span style={st.brsItemScore}>
                  {zero
                    ? <span style={{ color: "var(--c-text-dim)" }}>— / {item.max}{item.unit ? ` ${item.unit}` : ""}</span>
                    : <><span style={{ color: "var(--c-accent)", fontWeight: 700 }}>{item.score}</span>
                        <span style={{ color: "var(--c-text-muted)", fontSize: "0.7rem" }}> / {item.max}{item.unit ? ` ${item.unit}` : ""}</span></>
                  }
                </span>
              </div>
              <div style={{ ...st.bar, marginTop: 5 }}>
                {!zero && <div style={{ ...st.fill, width: `${pct}%`, background: progressColor(pct) }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Стили ─────────────────────────────────────────────────────────────────────
const st: Record<string, CSSProperties> = {
  card:          { width: "100%", background: "var(--c-card)", borderRadius: 10, border: "0.5px solid var(--c-border)", padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left" as const },
  pmCard:        { width: "100%", background: "var(--c-card)", borderRadius: 12, border: "0.5px solid var(--c-border)", padding: "14px 16px", marginBottom: 10, cursor: "pointer", textAlign: "left" as const },
  head:          { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  unitCode:      { color: "var(--c-accent)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 2 },
  unitTitle:     { color: "var(--c-text-primary)", fontSize: "0.88rem", fontWeight: 500 },
  dept:          { color: "var(--c-text-muted)", fontSize: "0.7rem", marginTop: 1, marginBottom: 4 },
  bar:           { height: 2, background: "var(--c-progress-track)", borderRadius: 1 },
  fill:          { height: "100%", borderRadius: 1 },
  footer:        { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  lc:            { color: "var(--c-text-secondary)", fontSize: "0.72rem", fontWeight: 500 },
  brsBadge:      { fontSize: "0.82rem", fontWeight: 700, color: "var(--c-accent)", flexShrink: 0 },
  brsMax:        { fontSize: "0.68rem", fontWeight: 400, color: "var(--c-text-muted)" },
  fcChip:        { fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.02em", padding: "2px 7px", borderRadius: 5 },
  fcDate:        { fontSize: "0.67rem", color: "var(--c-text-secondary)" },
  fcDatePlan:    { fontSize: "0.67rem", color: "var(--c-text-muted)", display: "flex", alignItems: "center", gap: 3 },
  fcPlanDot:     { width: 5, height: 5, borderRadius: "50%", border: "1.5px solid currentColor", display: "inline-block", flexShrink: 0 },
  fcPlanLabel:   { fontSize: "0.58rem", color: "var(--c-text-dim)" },
  brsBlock:      { background: "var(--c-card)", borderRadius: 12, border: "0.5px solid var(--c-border)", padding: "14px 16px", marginBottom: 16 },
  brsTotalRow:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  brsTotalLabel: { color: "var(--c-text-dim)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, flexShrink: 0 },
  brsTotalScore: { color: "var(--c-text-primary)", fontSize: "0.88rem", fontWeight: 700, flexShrink: 0 },
  brsGrid:       { display: "flex", flexDirection: "column" as const, gap: 10 },
  brsGridItem:   { paddingTop: 10, borderTop: "0.5px solid var(--c-border)" },
  brsItemRow:    { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  brsItemLabel:  { fontSize: "0.82rem" },
  brsItemScore:  { fontSize: "0.85rem", flexShrink: 0 },
};
