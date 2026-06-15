import type { FastifyInstance } from "fastify";
import type { ResumeRequest, ResumeResponse } from "@eios/contracts";
import type { Config } from "../config.js";
import type { Store } from "../store/index.js";
import { verify } from "../auth/index.js";

export function registerResume(
  app: FastifyInstance,
  deps: { cfg: Config; store: Store },
): void {
  // Только СИНХРОНИЗИРОВАННОЕ состояние (кросс-девайс ограничение, §2).
  app.post<{ Body: ResumeRequest }>("/resume", async (req): Promise<ResumeResponse> => {
    await verify(req.body.credential, deps.cfg);
    const cmi = await deps.store.getCmi(req.body.eventId, req.body.attemptId);
    return { cmi };
  });
}
