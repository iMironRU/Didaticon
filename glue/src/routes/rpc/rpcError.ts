// Соглашение по data-полю JSON-RPC ошибок (issue #67) — общее для dispatcher'а
// (routes/rpc.ts) и per-method хендлеров. code/message остаются по спеке
// JSON-RPC 2.0 (-32600..-32603, -32001 наш кастомный) — тут только data.
export interface RpcErrorData {
  action?: "relogin" | "retry_later" | "contact_support";
  field?:  string;
  detail?: string;
}

/** Хендлер бросает это на невалидных params — dispatcher превращает
 *  в -32602 Invalid params с data.field, а не в generic -32603. */
export class RpcValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
  }
}
