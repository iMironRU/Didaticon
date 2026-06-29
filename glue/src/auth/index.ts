// Аутентификация запроса к клею (docs/glue-contracts.md §2, §15.8).
// PWA → OIDC-токен Univerkon; станция локальной зоны → mTLS-серт (свидетель-credential).
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { StudentId, type Credential } from "@eios/contracts";
import type { Config } from "../config.js";

export interface Principal {
  studentId: StudentId;
  plane: "human" | "technical";
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks(cfg: Config) {
  // jose кеширует ключи + ротацию делает сама; одна инстанция на процесс.
  if (!jwks) jwks = createRemoteJWKSet(new URL(cfg.oidcJwksUrl));
  return jwks;
}

export class AuthError extends Error {}

export async function verify(cred: Credential, cfg: Config): Promise<Principal> {
  if (cred.kind === "oidc") {
    const { payload } = await jwtVerify(cred.value, getJwks(cfg), {
      issuer: cfg.oidcIssuer,
      audience: cfg.oidcAudience,
    }).catch((e: unknown) => {
      throw new AuthError(`OIDC token rejected: ${(e as Error).message}`);
    });
    return { studentId: studentIdFromClaims(payload), plane: "human" };
  }
  // §15.8: техническая плоскость держит только witness; validate ей недоступен.
  // TODO(срез-1): mTLS — сверить серт станции по allowlist кампусной зоны (§11).
  throw new AuthError("mTLS not implemented yet — only OIDC for срез-1");
}

/** Bearer header → проверенный JWT + все claims. Используется RPC-эндпоинтом
 *  где нужны и sub, и roles, и eiv (Block I §7). audience не проверяем —
 *  PWA получает токен с aud=eios-pwa (clientId), а cfg.oidcAudience=eios-glue. */
export async function verifyBearerToken(
  authHeader: string | undefined,
  cfg: Config,
): Promise<{ principal: Principal; claims: JWTPayload }> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header");
  }
  const token = authHeader.slice(7).trim();
  const { payload } = await jwtVerify(token, getJwks(cfg), {
    issuer: cfg.oidcIssuer,
  }).catch((e: unknown) => {
    throw new AuthError(`OIDC token rejected: ${(e as Error).message}`);
  });
  return {
    principal: { studentId: studentIdFromClaims(payload), plane: "human" },
    claims:    payload,
  };
}

function studentIdFromClaims(p: JWTPayload): StudentId {
  const sub = p.sub;
  if (typeof sub !== "string" || !sub) throw new AuthError("token has no sub");
  return StudentId(sub);
}
