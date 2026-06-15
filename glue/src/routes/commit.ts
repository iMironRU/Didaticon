import type { FastifyInstance } from "fastify";
import type { CommitRequest, CommitResponse } from "@eios/contracts";
import type { Config } from "../config.js";
import type { Store } from "../store/index.js";
import type { Outbox } from "../outbox/index.js";
import { verify } from "../auth/index.js";
import { maybeFormSvidetelstvo } from "../svidetelstvo.js";

export function registerCommit(
  app: FastifyInstance,
  deps: { cfg: Config; store: Store; outbox: Outbox },
): void {
  app.post<{ Body: CommitRequest }>("/commit", async (req): Promise<CommitResponse> => {
    const body = req.body;
    const principal = await verify(body.credential, deps.cfg);

    // 1. дедуп по (eventId, attemptId, sequence) + сохранить CMI (живое черновое)
    await deps.store.putCmi(body.eventId, body.attemptId, body.sequence, body.cmi);

    // 2. граница события? closure-семантика приходит из лонч-контекста.
    // TODO(срез-1): достать ClosureSemantics из тега лонч-контекста (см. §8.3).
    const closure = "pass" as const; // дефолт §4
    await maybeFormSvidetelstvo({
      store: deps.store,
      eventId: body.eventId,
      studentId: principal.studentId,
      attemptId: body.attemptId,
      closure,
      cmi: body.cmi,
    });

    return { accepted: true };
  });
}
