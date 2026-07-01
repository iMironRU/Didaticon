import type { FastifyInstance } from "fastify";
import type { ResumeRequest, ResumeResponse } from "@eios/contracts";
import type { Config } from "../config.js";
import type { Store } from "../store/index.js";
import { verify } from "../auth/index.js";
import { credentialSchema } from "./schemas.js";

const resumeSchema = {
  description: "Получить последнее СИНХРОНИЗИРОВАННОЕ состояние попытки для resume "
    + "(кросс-девайс ограничение — только то, что уже долетело коммитом, §2).",
  tags: ["scorm"],
  body: {
    type: "object",
    required: ["eventId", "attemptId", "credential"],
    properties: {
      eventId:    { type: "string" },
      attemptId:  { type: "string" },
      credential: credentialSchema,
    },
  },
  response: {
    200: {
      type: "object", required: ["cmi"],
      properties: {
        cmi: { type: "object", additionalProperties: true, nullable: true, description: "null = нет синхронизированного состояния" },
      },
    },
  },
} as const;

export function registerResume(
  app: FastifyInstance,
  deps: { cfg: Config; store: Store },
): void {
  // Только СИНХРОНИЗИРОВАННОЕ состояние (кросс-девайс ограничение, §2).
  app.post<{ Body: ResumeRequest }>("/resume", { schema: resumeSchema }, async (req): Promise<ResumeResponse> => {
    await verify(req.body.credential, deps.cfg);
    const cmi = await deps.store.getCmi(req.body.eventId, req.body.attemptId);
    return { cmi };
  });
}
