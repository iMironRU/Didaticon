// Фоновый outbox: CMI из буфера → клей /commit, с ретраями. Background Sync.
// docs/concept-eios.md §6.1.
import type { CommitRequest } from "@eios/contracts";
import { enqueue, drain, ack } from "./indexeddb.js";
import { token } from "../auth/oidc.js";

let seq = 0;

export async function bufferCommit(args: {
  eventId: string;
  attemptId: string;
  cmi: Record<string, unknown>;
}): Promise<void> {
  await enqueue({ ...args, sequence: ++seq });
  void flush();
}

export async function flush(): Promise<void> {
  const t = await token();
  if (!t) return;
  for (const { id, value } of await drain()) {
    const v = value as { eventId: string; attemptId: string; sequence: number; cmi: Record<string, unknown> };
    const body: CommitRequest = { ...v, credential: { kind: "oidc", value: t } };
    try {
      const r = await fetch("/api/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) await ack(id);
    } catch {
      // 1С/клей недоступны — оставляем в буфере, ретрай позже (прогресс не встаёт)
      break;
    }
  }
}
