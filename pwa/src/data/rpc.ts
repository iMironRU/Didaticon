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

// -32001 — зарезервирован под auth-ошибки с обеих сторон (client: нет/просрочен
// токен локально; glue: verifyBearerToken отклонил токен, напр. "exp" claim
// timestamp check failed при рассинхроне часов клиента с сервером или сбое
// silent renew). Сообщение всегда заменяем на понятное — сырые тексты вроде
// "OIDC token rejected: ..." не должны утекать в UI.
const AUTH_ERROR_MESSAGE = "Сессия истекла — обновите страницу и войдите снова";

export async function rpc<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const t = await token();
  if (!t) throw new RpcError(-32001, AUTH_ERROR_MESSAGE);

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
  if (data.error) {
    if (data.error.code === -32001) throw new RpcError(-32001, AUTH_ERROR_MESSAGE, data.error.data);
    throw new RpcError(data.error.code, data.error.message, data.error.data);
  }
  if (data.result === undefined) throw new RpcError(-32603, "Пустой result");
  return data.result;
}
