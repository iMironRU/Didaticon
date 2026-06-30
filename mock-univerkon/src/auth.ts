import type { Config } from "./config.js";

export class AuthError extends Error {}

/** Проверяет Bearer-токен сервиса (glue → mock-univerkon). */
export function requireServiceToken(authHeader: string | undefined, cfg: Config): void {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token || token !== cfg.serviceToken) {
    throw new AuthError("Invalid or missing service token");
  }
}

/** Проверяет Bearer-токен администратора (Management API). */
export function requireAdminToken(authHeader: string | undefined, cfg: Config): void {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token || token !== cfg.adminToken) {
    throw new AuthError("Invalid or missing admin token");
  }
}
