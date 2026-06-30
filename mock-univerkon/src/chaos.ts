import type Database from "better-sqlite3";
import type { FastifyRequest, FastifyReply } from "fastify";

export interface ChaosConfig {
  latency_min:       number;
  latency_max:       number;
  error_rate:        number;
  error_statuses:    number[];
  error_methods:     string[];
  partial_responses: boolean;
}

export function getChaos(db: Database.Database): ChaosConfig {
  const row = db.prepare("SELECT * FROM chaos_config WHERE id=1").get() as {
    latency_min: number;
    latency_max: number;
    error_rate: number;
    error_statuses: string;
    error_methods: string;
    partial_responses: number;
  } | undefined;
  if (!row) return { latency_min: 0, latency_max: 0, error_rate: 0, error_statuses: [503], error_methods: [], partial_responses: false };
  return {
    latency_min:       row.latency_min,
    latency_max:       row.latency_max,
    error_rate:        row.error_rate,
    error_statuses:    JSON.parse(row.error_statuses) as number[],
    error_methods:     JSON.parse(row.error_methods) as string[],
    partial_responses: row.partial_responses === 1,
  };
}

export function setChaos(db: Database.Database, cfg: Partial<ChaosConfig>): void {
  const current = getChaos(db);
  const merged = { ...current, ...cfg };
  db.prepare(`
    UPDATE chaos_config SET
      latency_min=?, latency_max=?, error_rate=?,
      error_statuses=?, error_methods=?, partial_responses=?
    WHERE id=1
  `).run(
    merged.latency_min, merged.latency_max, merged.error_rate,
    JSON.stringify(merged.error_statuses), JSON.stringify(merged.error_methods),
    merged.partial_responses ? 1 : 0,
  );
}

export function resetChaos(db: Database.Database): void {
  db.prepare(`
    UPDATE chaos_config SET
      latency_min=0, latency_max=0, error_rate=0,
      error_statuses='[503]', error_methods='[]', partial_responses=0
    WHERE id=1
  `).run();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Применяет chaos к входящему RPC-запросу. Возвращает true если запрос должен продолжиться. */
export async function applyChaos(
  db: Database.Database,
  method: string,
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> {
  const cfg = getChaos(db);

  // Latency
  if (cfg.latency_min > 0 || cfg.latency_max > 0) {
    const delay = cfg.latency_min + Math.random() * (cfg.latency_max - cfg.latency_min);
    await sleep(delay);
  }

  // Forced method error
  if (cfg.error_methods.includes(method)) {
    const status = cfg.error_statuses[0] ?? 503;
    reply.status(status).send({ jsonrpc: "2.0", id: null, error: { code: -32099, message: `Chaos: forced error on ${method}` } });
    return false;
  }

  // Random error
  if (cfg.error_rate > 0 && Math.random() < cfg.error_rate) {
    const statuses = cfg.error_statuses;
    const status = statuses[Math.floor(Math.random() * statuses.length)] ?? 503;
    req.log.warn({ method }, "chaos: random error injected");
    reply.status(status).send({ jsonrpc: "2.0", id: null, error: { code: -32099, message: "Chaos: random error" } });
    return false;
  }

  return true;
}
