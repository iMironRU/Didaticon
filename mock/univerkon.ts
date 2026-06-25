/**
 * Локальный mock Univerkon — только для разработки и smoke-теста.
 * Запуск: npm run mock
 *
 * Поднимает на :9000:
 *   GET  /.well-known/openid-configuration  → OIDC discovery
 *   GET  /jwks                              → публичный ключ (ES256)
 *   GET  /authorize                         → мгновенный редирект (без UI логина)
 *   POST /token                             → JWT (sub=student-001)
 *   POST /rpc                               → Univerkon JSON-RPC
 */
import http from "http";
import { URL } from "url";
import {
  generateKeyPair,
  exportJWK,
  SignJWT,
  type KeyLike,
} from "jose";

const PORT = 9000;
// В prod-подобной среде: MOCK_ISSUER=https://your.domain (для браузерного OIDC-флоу).
// Для локальной разработки оставить пустым — будет http://localhost:9000.
const ISSUER = process.env.MOCK_ISSUER ?? `http://localhost:${PORT}`;

// --- Ключ ---------------------------------------------------------------
async function init() {
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const jwk = await exportJWK(publicKey);
  jwk.kid = "mock-1";
  jwk.use = "sig";
  jwk.alg = "ES256";

  return { privateKey, jwk };
}

async function mintToken(sub: string, privateKey: KeyLike): Promise<string> {
  return new SignJWT({ sub, name: "Тестов Студент" })
    .setProtectedHeader({ alg: "ES256", kid: "mock-1" })
    .setIssuer(ISSUER)
    // aud содержит и client_id PWA и audience клея — для простоты smoke-теста
    .setAudience(["eios-pwa", "eios-glue"])
    .setExpirationTime("8h")
    .setIssuedAt()
    .sign(privateKey);
}

// --- Тестовая траектория -----------------------------------------------
function makeTrajectory(studentId: string) {
  return {
    student_id: studentId,
    discipline_title: "Тестовая дисциплина",
    nodes: [
      {
        unit_id:      "unit-1",
        event_id:     "event-smoke-1",
        title:        "Вводный SCORM-модуль",
        closure:      "completion",
        scorm_version:"1.2",
        package_url:  "/scorm/test/index.html",
        state:        "open",
      },
    ],
    projected_at: new Date().toISOString(),
  };
}

// --- HTTP-сервер -------------------------------------------------------
void (async () => {
const { privateKey, jwk } = await init();

function json(res: http.ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", ISSUER);
  const method = req.method ?? "GET";

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  // --- OIDC discovery
  if (method === "GET" && url.pathname === "/.well-known/openid-configuration") {
    return json(res, 200, {
      issuer: ISSUER,
      authorization_endpoint: `${ISSUER}/authorize`,
      token_endpoint: `${ISSUER}/token`,
      jwks_uri: `${ISSUER}/jwks`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["ES256"],
    });
  }

  // --- JWKS
  if (method === "GET" && url.pathname === "/jwks") {
    return json(res, 200, { keys: [jwk] });
  }

  // --- Authorize: мгновенный редирект без UI (smoke-тест, не прод)
  if (method === "GET" && url.pathname === "/authorize") {
    const redirectUri = url.searchParams.get("redirect_uri") ?? "";
    const state       = url.searchParams.get("state") ?? "";
    const target = new URL(redirectUri);
    target.searchParams.set("code",  "mock-code");
    target.searchParams.set("state", state);
    res.writeHead(302, { Location: target.toString() });
    return res.end();
  }

  // --- Token
  if (method === "POST" && url.pathname === "/token") {
    const token = await mintToken("student-001", privateKey);
    return json(res, 200, {
      access_token: token,
      id_token:     token,
      token_type:   "Bearer",
      expires_in:   28800,
    });
  }

  // --- Univerkon JSON-RPC
  if (method === "POST" && url.pathname === "/rpc") {
    const body = JSON.parse(await readBody(req)) as {
      jsonrpc: string;
      method: string;
      params: unknown;
      id: string;
    };

    console.log(`[mock] RPC ${body.method}`, JSON.stringify(body.params).slice(0, 120));

    if (body.method === "trajectory.get") {
      const params = body.params as { student_id: string };
      return json(res, 200, {
        jsonrpc: "2.0",
        id: body.id,
        result: makeTrajectory(params.student_id),
      });
    }

    if (body.method === "deposit_svidetelstvo") {
      const s = body.params as Record<string, unknown>;
      console.log(`[mock] Свидетельство: event=${s.event_id} student=${s.student_id} valence=${s.valence} status=${s.status}`);
      return json(res, 200, {
        jsonrpc: "2.0",
        id: body.id,
        result: { deduplicated: false },
      });
    }

    return json(res, 200, {
      jsonrpc: "2.0",
      id: body.id,
      error: { code: -32601, message: `Method not found: ${body.method}` },
    });
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`\nMock Univerkon -> http://localhost:${PORT}`);
  console.log(`  OIDC issuer:  ${ISSUER}`);
  console.log(`  JWKS:         ${ISSUER}/jwks`);
  console.log(`  RPC:          ${ISSUER}/rpc\n`);
});
})();
