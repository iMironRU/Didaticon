// Фоновый outbox: CMI из буфера → клей /commit, с ретраями. Background Sync.
// docs/concept-eios.md §6.1.
import type {
  CmiSnapshot,
  CommitRequest,
  EventId,
  AttemptId,
  ClosureSemantics,
} from "@eios/contracts";
import { enqueue, drain, ack } from "./indexeddb.js";
import { token } from "../auth/oidc.js";

let seq = 0;

export interface BufferedCommit {
  eventId: EventId;
  attemptId: AttemptId;
  closure: ClosureSemantics;
  cmi: CmiSnapshot;
  sequence: number;
}

export async function bufferCommit(args: {
  eventId: EventId;
  attemptId: AttemptId;
  closure: ClosureSemantics;
  cmi: CmiSnapshot;
}): Promise<void> {
  const rec: BufferedCommit = { ...args, sequence: ++seq };
  await enqueue(rec);
  void flush();
}

export async function flush(): Promise<void> {
  const t = await token();
  if (!t) return;
  for (const { id, value } of await drain()) {
    const v = value as BufferedCommit;
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
