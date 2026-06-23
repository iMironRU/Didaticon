// Клиент к ядру Univerkon. Транспорт JSON-RPC 2.0 + Bearer сервисный токен.
// docs/glue-contracts.md §3 (паттерн КандиМил).
// Wire-формат Univerkon — snake_case; наши типы — camelCase. Конвертация здесь.
import {
  EventId, StudentId, AttemptId, DidacticUnitId,
  type DepositSvidetelstvo,
  type DepositResult,
  type TrajectoryProjection,
  type TrajectoryNode,
} from "@eios/contracts";
import type { Config } from "../config.js";

// --- JSON-RPC 2.0 types ------------------------------------------------------

interface RpcRequest {
  jsonrpc: "2.0";
  method: string;
  params: unknown;
  id: string;
}

interface RpcSuccess<T> { jsonrpc: "2.0"; result: T; id: string }
interface RpcError     { jsonrpc: "2.0"; error: { code: number; message: string; data?: unknown }; id: string }
type RpcResponse<T> = RpcSuccess<T> | RpcError;

function isError<T>(r: RpcResponse<T>): r is RpcError {
  return "error" in r;
}

// --- Wire types (snake_case) --------------------------------------------------

interface WireDepositParams {
  event_id: string;
  student_id: string;
  attempt_id: string;
  valence: "positive" | "negative";
  status: string;
  raw_status: {
    scorm_version: "1.2" | "2004";
    lesson_status?: string;
    completion_status?: string;
    success_status?: string;
  };
  score?: { raw: number; min?: number; max?: number; scaled?: number };
  occurred_at: string;
}

interface WireDepositResult {
  deduplicated: boolean;
}

interface WireTrajectoryNode {
  unit_id: string;
  event_id: string;
  title: string;
  closure: "completion" | "pass";
  scorm_version: "1.2" | "2004";
  package_url: string;
  state: "open" | "in_progress" | "closed_positive" | "closed_negative";
}

interface WireTrajectoryProjection {
  student_id: string;
  discipline_title: string;
  nodes: WireTrajectoryNode[];
  projected_at: string;
}

// --- Client ------------------------------------------------------------------

export class UniverkonClient {
  constructor(private cfg: Config) {}

  async depositSvidetelstvo(s: DepositSvidetelstvo): Promise<DepositResult> {
    const params: WireDepositParams = {
      event_id:   s.eventId,
      student_id: s.studentId,
      attempt_id: s.attemptId,
      valence:    s.valence,
      status:     s.status,
      raw_status: {
        scorm_version:      s.rawStatus.scormVersion,
        lesson_status:      s.rawStatus.lessonStatus,
        completion_status:  s.rawStatus.completionStatus,
        success_status:     s.rawStatus.successStatus,
      },
      score:       s.score ? {
        raw:    s.score.raw,
        min:    s.score.min,
        max:    s.score.max,
        scaled: s.score.scaled,
      } : undefined,
      occurred_at: s.occurredAt,
    };

    const result = await this.rpc<WireDepositResult>("deposit_svidetelstvo", params);
    return { deduplicated: result.deduplicated };
  }

  async getTrajectory(studentId: StudentId): Promise<TrajectoryProjection> {
    const result = await this.rpc<WireTrajectoryProjection>("trajectory.get", {
      student_id: studentId,
    });
    return mapTrajectory(result);
  }

  // --- JSON-RPC helper -------------------------------------------------------

  private async rpc<T>(method: string, params: unknown): Promise<T> {
    const req: RpcRequest = {
      jsonrpc: "2.0",
      method,
      params,
      id: crypto.randomUUID(),
    };

    let res: Response;
    try {
      res = await fetch(this.cfg.univerkonRpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.cfg.univerkonServiceToken}`,
        },
        body: JSON.stringify(req),
      });
    } catch (e) {
      // Сетевая ошибка — outbox повторит.
      throw new Error(`Univerkon unreachable: ${(e as Error).message}`);
    }

    if (!res.ok) {
      throw new Error(`Univerkon HTTP ${res.status} on ${method}`);
    }

    const body = await res.json() as RpcResponse<T>;

    if (isError(body)) {
      throw new Error(
        `Univerkon RPC error ${body.error.code} on ${method}: ${body.error.message}`,
      );
    }

    return body.result;
  }
}

// --- Mapping wire → domain ---------------------------------------------------

function mapTrajectory(w: WireTrajectoryProjection): TrajectoryProjection {
  return {
    studentId:       StudentId(w.student_id),
    disciplineTitle: w.discipline_title,
    nodes:           w.nodes.map(mapNode),
    projectedAt:     w.projected_at,
  };
}

function mapNode(w: WireTrajectoryNode): TrajectoryNode {
  return {
    unitId:       DidacticUnitId(w.unit_id),
    eventId:      EventId(w.event_id),
    title:        w.title,
    closure:      w.closure,
    scormVersion: w.scorm_version,
    packageUrl:   w.package_url,
    state:        w.state,
  };
}
