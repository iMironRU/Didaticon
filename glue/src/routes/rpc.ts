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
 *   -32602 Invalid params
 *   -32603 Internal error
 *   -32001 Authentication failed (custom)
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { JWTPayload } from "jose";
import type { Config } from "../config.js";
import { AuthError, verifyBearerToken } from "../auth/index.js";
import { identityContextsGet } from "./rpc/identity-contexts.js";

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
  // "identity.e_student.issue": ...будет реализовано позже
};

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, data?: unknown): JsonRpcResponse {
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
        return reply.send(rpcError(body.id, -32001, e.message));
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
      const msg = e instanceof Error ? e.message : String(e);
      req.log.error({ err: e, method: body.method }, "RPC handler failed");
      return reply.send(rpcError(body.id, -32603, "Internal error", msg));
    }
  });
}
