/**
 * Mock Univerkon — реалистичная заглушка Univerkon JSON-RPC для dev/staging.
 *
 * Поднимает на PORT (по умолчанию 9000):
 *   POST /rpc          — JSON-RPC 2.0 (service Bearer token)
 *   GET  /healthz      — health check
 *   GET  /admin/*      — management API (admin Bearer token)
 *
 * Legacy OIDC-эндпоинты (совместимость со smoke-тестом CI):
 *   GET  /.well-known/openid-configuration
 *   GET  /jwks
 *   GET  /authorize
 *   POST /token
 */
import Fastify from "fastify";
import {
  generateKeyPair, exportJWK, SignJWT,
  type KeyLike,
} from "jose";
import { loadConfig } from "./config.js";
import { initDb } from "./store/sqlite.js";
import { requireServiceToken, AuthError } from "./auth.js";
import { applyChaos } from "./chaos.js";
import { RPC_METHODS } from "./rpc/router.js";
import { registerAdmin } from "./admin/routes.js";

const cfg = loadConfig();
const db  = initDb(cfg.sqlitePath);

// ── Legacy OIDC key (совместимость с smoke-тестом) ────────────────────────────
const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
const jwk = await exportJWK(publicKey);
jwk.kid = "mock-1";
jwk.use = "sig";
jwk.alg = "ES256";

const ISSUER = process.env.MOCK_ISSUER ?? `http://localhost:${cfg.port}`;

async function mintToken(sub: string, pk: KeyLike): Promise<string> {
  return new SignJWT({ sub, name: "Тестов Студент" })
    .setProtectedHeader({ alg: "ES256", kid: "mock-1" })
    .setIssuer(ISSUER)
    .setAudience(["eios-pwa", "eios-glue"])
    .setExpirationTime("8h")
    .setIssuedAt()
    .sign(pk);
}

// ── Fastify app ───────────────────────────────────────────────────────────────
const app = Fastify({ logger: true });

// /token принимает form-encoded (OAuth2 convention) → парсим как raw строку
app.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_req, body, done) => {
  done(null, body);
});

// ── Healthz ───────────────────────────────────────────────────────────────────
app.get("/healthz", async () => ({
  ok:      true,
  service: "mock-univerkon",
  version: process.env.npm_package_version ?? "0.1.0",
}));

// ── Legacy OIDC (для CI smoke-теста) ─────────────────────────────────────────
app.get("/.well-known/openid-configuration", async () => ({
  issuer:                               ISSUER,
  authorization_endpoint:               `${ISSUER}/authorize`,
  token_endpoint:                       `${ISSUER}/token`,
  jwks_uri:                             `${ISSUER}/jwks`,
  response_types_supported:             ["code"],
  grant_types_supported:                ["authorization_code"],
  code_challenge_methods_supported:     ["S256"],
  subject_types_supported:              ["public"],
  id_token_signing_alg_values_supported:["ES256"],
}));

app.get("/jwks", async () => ({ keys: [jwk] }));

app.get("/authorize", async (req, reply) => {
  const qs     = (req.query as Record<string, string>);
  const target = new URL(qs.redirect_uri ?? "http://localhost");
  target.searchParams.set("code",  "mock-code");
  target.searchParams.set("state", qs.state ?? "");
  return reply.redirect(302, target.toString());
});

app.post("/token", async () => {
  const token = await mintToken("student-001", privateKey);
  return { access_token: token, id_token: token, token_type: "Bearer", expires_in: 28800 };
});

// ── JSON-RPC 2.0 ──────────────────────────────────────────────────────────────
interface RpcBody { jsonrpc: string; method: string; params?: Record<string, unknown>; id: string | number | null }

function rpcErr(id: RpcBody["id"], code: number, msg: string) {
  return { jsonrpc: "2.0", id, error: { code, message: msg } };
}

app.post("/rpc", async (req, reply) => {
  const body = req.body as RpcBody | undefined;
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return reply.send(rpcErr(body?.id ?? null, -32600, "Invalid Request"));
  }

  // Аутентификация
  try {
    requireServiceToken(req.headers.authorization, cfg);
  } catch (e) {
    if (e instanceof AuthError) {
      return reply.send(rpcErr(body.id, -32001, e.message));
    }
    throw e;
  }

  // Chaos middleware
  const ok = await applyChaos(db, body.method, req, reply);
  if (!ok) return;

  // Диспатч
  const handler = RPC_METHODS[body.method];
  if (!handler) {
    return reply.send(rpcErr(body.id, -32601, `Method not found: ${body.method}`));
  }

  try {
    const result = handler(db, body.params ?? {});
    return reply.send({ jsonrpc: "2.0", id: body.id, result });
  } catch (e) {
    const rpcE = e as { code?: number; message?: string };
    if (typeof rpcE.code === "number") {
      return reply.send(rpcErr(body.id, rpcE.code, rpcE.message ?? "RPC error"));
    }
    req.log.error({ err: e, method: body.method }, "RPC handler failed");
    return reply.send(rpcErr(body.id, -32603, "Internal error"));
  }
});

// ── Management API ────────────────────────────────────────────────────────────
registerAdmin(app, db, cfg);

// ── Start ─────────────────────────────────────────────────────────────────────
await app.listen({ port: cfg.port, host: "0.0.0.0" });
app.log.info(`mock-univerkon → http://localhost:${cfg.port}`);
app.log.info(`  RPC:   POST /rpc`);
app.log.info(`  Admin: GET/POST /admin/chaos /admin/scenarios /admin/reset`);
