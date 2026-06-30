import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type Database from "better-sqlite3";
import type { Config } from "../config.js";
import { requireAdminToken, AuthError } from "../auth.js";
import { getChaos, setChaos, resetChaos } from "../chaos.js";
import { listScenarios, loadScenario, currentScenario } from "./scenarios.js";
import { loadSeed, DEFAULT_SEED } from "../store/sqlite.js";

export function registerAdmin(app: FastifyInstance, db: Database.Database, cfg: Config): void {

  // ── Auth hook ──────────────────────────────────────────────────────────────
  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.url.startsWith("/admin")) return;
    try {
      requireAdminToken(req.headers.authorization, cfg);
    } catch (e) {
      if (e instanceof AuthError) {
        return reply.status(401).send({ error: e.message });
      }
      throw e;
    }
  });

  // ── Chaos ──────────────────────────────────────────────────────────────────
  app.get("/admin/chaos", async () => getChaos(db));

  app.post("/admin/chaos", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as {
      latency?: { min?: number; max?: number };
      error_rate?: number;
      error_statuses?: number[];
      error_methods?: string[];
      partial_responses?: boolean;
    };
    setChaos(db, {
      latency_min:       body.latency?.min,
      latency_max:       body.latency?.max,
      error_rate:        body.error_rate,
      error_statuses:    body.error_statuses,
      error_methods:     body.error_methods,
      partial_responses: body.partial_responses,
    });
    return reply.send({ ok: true, chaos: getChaos(db) });
  });

  app.delete("/admin/chaos", async (req: FastifyRequest, reply: FastifyReply) => {
    resetChaos(db);
    return reply.send({ ok: true });
  });

  // ── Scenarios ─────────────────────────────────────────────────────────────
  app.get("/admin/scenarios", async () => ({ scenarios: listScenarios() }));

  app.get("/admin/scenarios/current", async () => currentScenario());

  app.post<{ Params: { id: string } }>("/admin/scenarios/:id/load", async (req, reply) => {
    try {
      loadScenario(db, req.params.id);
      return reply.send({ ok: true, active: currentScenario() });
    } catch (e) {
      return reply.status(404).send({ error: (e as Error).message });
    }
  });

  // ── Reset ─────────────────────────────────────────────────────────────────
  app.post("/admin/reset", async (_req, reply) => {
    loadSeed(db, DEFAULT_SEED);
    resetChaos(db);
    return reply.send({ ok: true, scenario: "default" });
  });

  // ── Quick-read endpoints ───────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>("/admin/students/:id", async (req, reply) => {
    const person = db.prepare("SELECT * FROM persons WHERE id=? AND type='student'").get(req.params.id);
    if (!person) return reply.status(404).send({ error: "not found" });
    const entries = db.prepare("SELECT * FROM gradebook_entries WHERE student_id=?").all(req.params.id);
    const notifs  = db.prepare("SELECT * FROM notifications WHERE student_id=?").all(req.params.id);
    return reply.send({ person, gradebook: entries, notifications: notifs });
  });
}
