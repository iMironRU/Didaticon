/**
 * JSON-RPC 2.0 endpoint `/rpc` (после Caddy прокси — `/api/rpc`).
 *
 * Единый протокол для всех новых API (Block I §2.5):
 *  - identity.contexts.get   (Block I §8)
 *  - identity.e_student.issue (Block I §9) — будет позже
 *  - dashboard.feed.get, schedule.get, gradebook.get — следующие блоки
 *
 * Auth — JWT в Authorization: Bearer header (тот же JWKS что и /commit).
 *
 * JSON-RPC error codes:
 *   -32700 Parse error
 *   -32600 Invalid Request
 *   -32601 Method not found
 *   -32602 Invalid params    — хендлер бросил RpcValidationError, data.field
 *   -32603 Internal error    — data.action="retry_later", data.detail=exception message
 *   -32001 Authentication failed (custom) — data.action="relogin"
 *
 * error.data — см. RpcErrorData в ./rpc/rpcError.ts (issue #67).
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { JWTPayload } from "jose";
import type { Config } from "../config.js";
import { AuthError, verifyBearerToken } from "../auth/index.js";
import { identityContextsGet } from "./rpc/identity-contexts.js";
import { identityEStudentIssue } from "./rpc/identity-estudent.js";
import { feedGet } from "./rpc/feed-get.js";
import { RpcValidationError, type RpcErrorData } from "./rpc/rpcError.js";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method:  string;
  params?: Record<string, unknown>;
  id:      string | number | null;
}

interface JsonRpcError {
  code:    number;
  message: string;
  data?:   unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id:      string | number | null;
  result?: unknown;
  error?:  JsonRpcError;
}

type Handler = (params: Record<string, unknown>, claims: JWTPayload) => Promise<unknown>;

const methods: Record<string, Handler> = {
  "identity.contexts.get":    identityContextsGet,
  "identity.e_student.issue": identityEStudentIssue,
  "feed.get":                 feedGet,
};

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, data?: RpcErrorData): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

export function registerRpc(app: FastifyInstance, { cfg }: { cfg: Config }) {
  app.post("/rpc", async (req: FastifyRequest, reply: FastifyReply) => {
    // 1. Парсим тело
    const body = req.body as JsonRpcRequest | undefined;
    if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
      return reply.send(rpcError(body?.id ?? null, -32600, "Invalid Request"));
    }

    // 2. Auth — для всех методов кроме открытых (пока нет открытых)
    let claims: JWTPayload;
    try {
      const result = await verifyBearerToken(req.headers.authorization, cfg);
      claims = result.claims;
    } catch (e) {
      if (e instanceof AuthError) {
        return reply.send(rpcError(body.id, -32001, e.message, { action: "relogin" }));
      }
      throw e;
    }

    // 3. Диспатч
    const handler = methods[body.method];
    if (!handler) {
      return reply.send(rpcError(body.id, -32601, `Method not found: ${body.method}`));
    }

    try {
      const result = await handler(body.params ?? {}, claims);
      return reply.send({ jsonrpc: "2.0", id: body.id, result } satisfies JsonRpcResponse);
    } catch (e) {
      if (e instanceof RpcValidationError) {
        return reply.send(rpcError(body.id, -32602, e.message, { field: e.field }));
      }
      const msg = e instanceof Error ? e.message : String(e);
      req.log.error({ err: e, method: body.method }, "RPC handler failed");
      return reply.send(rpcError(body.id, -32603, "Internal error", { action: "retry_later", detail: msg }));
    }
  });
}
