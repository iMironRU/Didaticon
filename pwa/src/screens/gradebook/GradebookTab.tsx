import { useState } from "react";
import type { CSSProperties } from "react";
import type { GradebookResponse, GradebookSemester, GradebookEntry, GradebookFinalControl, BookingSlot } from "@eios/contracts";
import { gradeColor } from "../../utils/grade.js";
import { useLocale, type StringKey } from "../../locale.js";
import { fcChipStyle } from "../../utils/color.js";
import { formatIsoDate, ROMAN } from "../../utils/date.js";

interface Props {
  gradebook:    GradebookResponse;
  onBookRetake?: (entry: GradebookEntry, slot: BookingSlot) => void;
}

// GradebookTab — зачётная книжка ──────────────────────────────────────────────
export function GradebookTab({ gradebook, onBookRetake }: Props) {
  const { t } = useLocale();
  const semesters  = gradebook.semesters;
  const currentIdx = semesters.findIndex(s => s.isCurrent);
  const [selIdx, setSelIdx] = useState(currentIdx >= 0 ? currentIdx : semesters.length - 1);
  const sem = semesters[selIdx];
  if (!sem) return <div style={st.empty}>{t("dataUnavailable")}</div>;

  const isSpO = sem.entries.some(e => e.groupCode);

  return (
    <div>
      {/* Вкладки семестров */}
      <div style={st.semTabs}>
        {semesters.map((s, i) => (
          <button
            key={s.period}
            style={{ ...st.semTab, ...(i === selIdx ? st.semTabActive : {}) }}
            onClick={() => setSelIdx(i)}
          >
            {semShort(s, i + 1, t)}
          </button>
        ))}
      </div>

      {/* Метка семестра */}
      <div style={st.semLabel}>{sem.label}</div>

      {/* Записи */}
      {isSpO
        ? <SpOGroupedEntries semester={sem} onBook={onBookRetake} />
        : <VoEntries semester={sem} onBook={onBookRetake} />
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
      {semester.entries.map(e => (
        <EntryRow key={e.unitId} entry={e} onBook={onBook} />
      ))}
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
        <div key={g.code} style={st.pmBlock}>
          <div style={st.pmHeader}>
            <span style={st.pmCode}>{g.code}</span>
            <span style={st.pmTitle}>{g.title}</span>
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
  const fc   = entry.finalControl;
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div style={st.row} onClick={fc.state === "failed_retake_scheduled" ? () => setExpanded(e => !e) : undefined}>
        <div style={{ ...st.typeTag, ...fcChipStyle(fc.type) }}>{fc.type}</div>
        <div style={st.rowBody}>
          {entry.code && <span style={st.entryCode}>{entry.code}</span>}
          {entry.title}
        </div>
        <div style={st.credits}>{entry.credits} {t("creditsUnit")}</div>
        <GradeCell fc={fc} />
      </div>

      {/* Слоты для пересдачи */}
      {expanded && fc.state === "failed_retake_scheduled" && (
        <div style={st.slotsBlock}>
          <div style={st.slotsLabel}>
            {t("retakeNum")}{fc.attemptNumber}{fc.isCommission ? ` ${t("commission")}` : ""}
            {" · "}{formatIsoDate(fc.retakeDate)}
          </div>
          {fc.availableSlots.length === 0 ? (
            <div style={st.slotsEmpty}>{t("noSlots")}</div>
          ) : (
            fc.availableSlots.map(slot => (
              <div key={slot.bookingSlotId} style={st.slotRow}>
                <span style={st.slotTime}>{slot.timeStart}–{slot.timeEnd}{slot.room ? ` · ${slot.room}` : ""}</span>
                <span style={st.slotSpots}>{slot.availableSpots} {t("spots")}</span>
                {onBook && slot.availableSpots > 0 && (
                  <button style={st.bookBtn} onClick={e => { e.stopPropagation(); onBook(entry, slot); }}>
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
  if (fc.state === "passed") {
    return (
      <div style={{ ...st.grade, color: gradeColor(fc.grade) }}>
        {fc.grade}
        {fc.grade100 != null && <span style={st.grade100}>/{fc.grade100}</span>}
      </div>
    );
  }
  if (fc.state === "in_progress") {
    return <div style={{ ...st.grade, color: "var(--c-text-dim)" }}>—</div>;
  }
  if (fc.state === "failed_retake_scheduled") {
    return (
      <div style={{ ...st.grade, color: "var(--c-danger)" }}>
        {t("debt")} <span style={{ fontSize: "0.6rem" }}>›</span>
      </div>
    );
  }
  if (fc.state === "failed_retake_pending") {
    return <div style={{ ...st.grade, color: "var(--c-danger)" }}>{t("debt")}</div>;
  }
  // failed_final
  return <div style={{ ...st.grade, color: "var(--c-danger)" }}>✗</div>;
}

// ── Стили ─────────────────────────────────────────────────────────────────────
const st: Record<string, CSSProperties> = {
  empty:       { color: "var(--c-text-dim)", textAlign: "center" as const, padding: "32px 0", fontSize: "0.85rem" },
  semTabs:     { display: "flex", gap: 4, overflowX: "auto", marginBottom: 12, paddingBottom: 4 },
  semTab:      { flexShrink: 0, border: "1px solid var(--c-border)", borderRadius: 6, background: "none", color: "var(--c-text-muted)", fontSize: "0.72rem", fontWeight: 500, padding: "5px 10px", cursor: "pointer", whiteSpace: "nowrap" as const },
  semTabActive:{ background: "var(--c-accent)", borderColor: "var(--c-accent)", color: "#fff" },
  semLabel:    { color: "var(--c-text-muted)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 10, fontWeight: 600 },
  pmBlock:     { marginBottom: 16, background: "var(--c-card)", borderRadius: 12, border: "0.5px solid var(--c-border)", overflow: "hidden" as const },
  pmHeader:    { display: "flex", alignItems: "baseline", gap: 8, padding: "10px 14px", background: "color-mix(in srgb, var(--c-accent) 8%, transparent)", borderBottom: "0.5px solid var(--c-border)" },
  pmCode:      { color: "var(--c-accent)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0 },
  pmTitle:     { color: "var(--c-text-primary)", fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.3 },
  row:         { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--c-card)", borderRadius: 8, border: "0.5px solid var(--c-border)", marginBottom: 6 },
  typeTag:     { fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.02em", padding: "2px 6px", borderRadius: 4, flexShrink: 0 },
  rowBody:     { flex: 1, color: "var(--c-text-primary)", fontSize: "0.82rem", lineHeight: 1.3 },
  entryCode:   { display: "block", color: "var(--c-accent)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.03em", marginBottom: 1 },
  credits:     { color: "var(--c-text-dim)", fontSize: "0.7rem", flexShrink: 0 },
  grade:       { fontSize: "0.85rem", fontWeight: 700, flexShrink: 0, minWidth: 40, textAlign: "right" as const },
  grade100:    { fontSize: "0.6rem", fontWeight: 400, color: "var(--c-text-muted)" },
  slotsBlock:  { background: "color-mix(in srgb, var(--c-danger) 6%, transparent)", border: "0.5px solid var(--c-danger)", borderRadius: 8, padding: "10px 14px", marginTop: -4, marginBottom: 6 },
  slotsLabel:  { color: "var(--c-danger)", fontSize: "0.72rem", fontWeight: 600, marginBottom: 8 },
  slotsEmpty:  { color: "var(--c-text-dim)", fontSize: "0.78rem" },
  slotRow:     { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "0.5px solid var(--c-border)" },
  slotTime:    { flex: 1, color: "var(--c-text-secondary)", fontSize: "0.8rem" },
  slotSpots:   { color: "var(--c-text-muted)", fontSize: "0.72rem" },
  bookBtn:     { border: "none", background: "var(--c-accent)", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: "0.72rem", cursor: "pointer" },
};
