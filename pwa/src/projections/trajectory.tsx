// Проекция траектории/дисциплин из Univerkon. stale-while-revalidate +
// метка свежести (§6.2): лежачая 1С → показываем устаревшее, помеченным.
import { useEffect, useState } from "react";
import type {
  StudentId,
  TrajectoryProjection,
  TrajectoryNode,
  LaunchContext,
} from "@eios/contracts";
import { AttemptId } from "@eios/contracts";
import { token } from "../auth/oidc.js";
import { getCachedProjection, putCachedProjection } from "../offline/indexeddb.js";
import { ScormPlayer } from "../player/ScormPlayer.js";

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
  | { kind: "stale"; data: TrajectoryProjection }
  | { kind: "fresh"; data: TrajectoryProjection }
  | { kind: "error"; cached?: TrajectoryProjection; message: string };

export function Trajectory({ studentId }: { studentId: StudentId }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [active, setActive] = useState<LaunchContext | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      const cached = await getCachedProjection(studentId);
      if (cached && alive) setState({ kind: "stale", data: cached });
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

  if (active) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <div style={{ padding: "4px 8px", background: "#f0f0f0", fontSize: "0.85em" }}>
          <button onClick={() => setActive(null)}>← Назад</button>
        </div>
        <div style={{ flex: 1 }}>
          <ScormPlayer ctx={active} />
        </div>
      </div>
    );
  }

  if (state.kind === "loading") return <p>Загрузка…</p>;
  if (state.kind === "error" && !state.cached) {
    return <p>Ошибка: {state.message}. Нет кешированных данных.</p>;
  }

  const data = state.kind === "error" ? state.cached! : state.data;
  const isStale = state.kind === "stale" || state.kind === "error";

  return (
    <div style={{ padding: "16px" }}>
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
      <ul style={{ listStyle: "none", padding: 0 }}>
        {data.nodes.map((n) => (
          <NodeRow
            key={n.eventId}
            node={n}
            onLaunch={() => setActive(nodeToLaunchCtx(n))}
          />
        ))}
      </ul>
    </div>
  );
}

function nodeToLaunchCtx(n: TrajectoryNode): LaunchContext {
  return {
    eventId: n.eventId,
    // Новая попытка при каждом запуске оценочного узла; resume для контентного.
    // Для среза 1 упрощаем: attemptId = "attempt-" + timestamp.
    // Univerkon выдаст реальный attemptId при интеграции.
    attemptId: AttemptId(`attempt-${Date.now()}`),
    closure: n.closure,
    scormVersion: n.scormVersion,
    packageUrl: n.packageUrl,
  };
}

function NodeRow({
  node,
  onLaunch,
}: {
  node: TrajectoryNode;
  onLaunch: () => void;
}) {
  const canLaunch = node.state !== "closed_positive";
  return (
    <li style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
      <span>{node.title}</span>{" "}
      <NodeState state={node.state} />
      {canLaunch && (
        <button style={{ marginLeft: "8px" }} onClick={onLaunch}>
          {node.state === "in_progress" ? "Продолжить" : "Запустить"}
        </button>
      )}
    </li>
  );
}

function NodeState({ state }: { state: TrajectoryNode["state"] }) {
  const labels: Record<typeof state, string> = {
    open: "Открыто",
    in_progress: "В процессе",
    closed_positive: "Зачтено",
    closed_negative: "Не зачтено",
  };
  return <span style={{ fontSize: "0.85em", color: "gray" }}>— {labels[state]}</span>;
}
