// Проекция траектории/дисциплин из Univerkon. stale-while-revalidate +
// метка свежести (§6.2): лежачая 1С → показываем устаревшее, помеченным.
import { useEffect, useState } from "react";
import type { StudentId, TrajectoryProjection } from "@eios/contracts";
import { token } from "../auth/oidc.js";
import { getCachedProjection, putCachedProjection } from "../offline/indexeddb.js";

async function fetchProjection(studentId: StudentId): Promise<TrajectoryProjection> {
  const t = await token();
  const r = await fetch("/api/projection", {
    headers: t ? { Authorization: `Bearer ${t}` } : {},
  });
  if (!r.ok) throw new Error(`projection ${r.status}`);
  const data = await r.json() as TrajectoryProjection;
  await putCachedProjection(studentId, data);
  return data;
}

type State =
  | { kind: "loading" }
  | { kind: "stale"; data: TrajectoryProjection }  // из кеша, фон ещё грузит
  | { kind: "fresh"; data: TrajectoryProjection }
  | { kind: "error"; cached?: TrajectoryProjection; message: string };

export function Trajectory({ studentId }: { studentId: StudentId }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;

    async function load() {
      // 1. Сразу отдаём кеш (stale)
      const cached = await getCachedProjection(studentId);
      if (cached && alive) setState({ kind: "stale", data: cached });

      // 2. Фоном тянем свежее
      try {
        const fresh = await fetchProjection(studentId);
        if (alive) setState({ kind: "fresh", data: fresh });
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : String(e);
        setState((s) =>
          s.kind === "stale" || s.kind === "fresh"
            ? { kind: "error", cached: s.data, message: msg }
            : { kind: "error", message: msg },
        );
      }
    }

    void load();
    return () => { alive = false; };
  }, [studentId]);

  if (state.kind === "loading") return <p>Загрузка…</p>;

  if (state.kind === "error" && !state.cached) {
    return <p>Ошибка: {state.message}. Нет кешированных данных.</p>;
  }

  const data =
    state.kind === "error" ? state.cached! : state.data;
  const isStale = state.kind === "stale" || state.kind === "error";

  return (
    <div>
      <h1>{data.disciplineTitle}</h1>
      {isStale && (
        <p style={{ color: "gray", fontSize: "0.85em" }}>
          Офлайн — данные на{" "}
          {new Date(data.projectedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {state.kind === "error" && ` (ошибка: ${state.message})`}
        </p>
      )}
      <ul>
        {data.nodes.map((n) => (
          <li key={n.eventId}>
            <span>{n.title}</span>{" "}
            <NodeState state={n.state} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NodeState({ state }: { state: TrajectoryProjection["nodes"][number]["state"] }) {
  const labels: Record<typeof state, string> = {
    open: "Открыто",
    in_progress: "В процессе",
    closed_positive: "Зачтено",
    closed_negative: "Не зачтено",
  };
  return <span style={{ fontSize: "0.85em", color: "gray" }}>— {labels[state]}</span>;
}
