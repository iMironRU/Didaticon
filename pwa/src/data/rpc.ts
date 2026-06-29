/**
 * JSON-RPC 2.0 клиент для нашего glue (`/api/rpc`).
 *
 * Автоматически добавляет Bearer JWT в заголовок.
 * Возвращает `result` или бросает RpcError.
 *
 * Используется для всех Block I+ методов:
 *  - identity.contexts.get
 *  - identity.e_student.issue
 *  - schedule.get, gradebook.get, ... (следующие блоки)
 */
import { token } from "../auth/oidc.js";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method:  string;
  params?: Record<string, unknown>;
  id:      number;
}

interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id:      number;
  result?: T;
  error?:  { code: number; message: string; data?: unknown };
}

export class RpcError extends Error {
  constructor(public code: number, message: string, public data?: unknown) {
    super(message);
    this.name = "RpcError";
  }
}

let _seq = 0;

export async function rpc<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const t = await token();
  if (!t) throw new RpcError(-32001, "Не авторизован");

  const body: JsonRpcRequest = { jsonrpc: "2.0", method, params, id: ++_seq };
  const r = await fetch("/api/rpc", {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body:    JSON.stringify(body),
  });

  if (!r.ok) {
    throw new RpcError(-32000, `HTTP ${r.status}: ${r.statusText}`);
  }

  const data = await r.json() as JsonRpcResponse<T>;
  if (data.error) throw new RpcError(data.error.code, data.error.message, data.error.data);
  if (data.result === undefined) throw new RpcError(-32603, "Пустой result");
  return data.result;
}
