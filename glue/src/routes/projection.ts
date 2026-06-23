// GET /projection — отдать проекцию траектории студента из Univerkon.
// Аутентификация: тот же OIDC-токен; studentId берётся из токена, не из query.
// docs/concept-eios.md §6.2.
import type { FastifyInstance } from "fastify";
import type { TrajectoryProjection } from "@eios/contracts";
import type { Config } from "../config.js";
import type { Credential } from "@eios/contracts";
import type { UniverkonClient } from "../univerkon/client.js";
import { verify } from "../auth/index.js";

interface ProjectionQuery { _unused?: string }

export function registerProjection(
  app: FastifyInstance,
  deps: { cfg: Config; univerkon: UniverkonClient },
): void {
  app.get<{ Querystring: ProjectionQuery }>("/projection", async (req): Promise<TrajectoryProjection> => {
    // Токен приходит через Authorization: Bearer (стандарт для GET).
    const auth = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    const credential: Credential = { kind: "oidc", value: auth };
    const principal = await verify(credential, deps.cfg);
    return deps.univerkon.getTrajectory(principal.studentId);
  });
}
