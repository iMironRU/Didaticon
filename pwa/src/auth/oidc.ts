// OIDC против Univerkon (provider реализован на стороне Univerkon).
// В mock-режиме провайдер = Auth0, namespaced custom claims под `https://eios/`.
// Реальный Univerkon будет писать без namespace.
//
// Контракт identity — [[didakticon-block1-identity]] §7.
import { UserManager, WebStorageStateStore } from "oidc-client-ts";
import { StudentId } from "@eios/contracts";
import { config } from "../config.js";

/** Block I §4: закрытый список 5 ролей. */
export type RoleName = "student" | "parent" | "teacher" | "examiner" | "applicant";

/** Block I §5: модификаторы только для teacher. Открытый список — клиент
 *  ОБЯЗАН игнорировать неизвестные значения (forward-compat). */
export type TeacherModifier = "senior_grader" | "curator";

/** Block I §7.1: элемент массива roles[] в ID Token. */
export interface Role {
  name:       RoleName;
  modifiers?: string[];   // НЕ TeacherModifier[] — могут быть неизвестные, не падать
}

/** Полная identity физика — из JWT. Stable per Block I §7. */
export interface PersonIdentity {
  sub:          string;   // единый ID физлица ОО (immutable)
  name:         string;   // ФИО составное
  givenName:    string;
  familyName:   string;
  middleName?:  string;
  eiv:          string;   // display ID
  roles:        Role[];   // массив ролей с модификаторами
}

const mgr = new UserManager({
  authority: config.oidcIssuer,
  client_id: config.oidcClientId,
  redirect_uri: window.location.origin + "/callback",
  post_logout_redirect_uri: window.location.origin + "/",
  scope: "openid profile",
  response_type: "code",   // code + PKCE
  loadUserInfo: false,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});

const KNOWN_ROLES: ReadonlySet<RoleName> = new Set([
  "student", "parent", "teacher", "examiner", "applicant",
]);

export async function login(): Promise<void> {
  await mgr.signinRedirect();
}

export async function loginAs(email: string): Promise<void> {
  await mgr.signinRedirect({ login_hint: email });
}

export async function logout(): Promise<void> {
  await mgr.signoutRedirect();
}

/** Вызывается из main.tsx при заходе на /callback. */
export async function handleCallback(): Promise<void> {
  await mgr.signinRedirectCallback();
  // Чистим query-string (?code=...&state=...) из URL.
  window.history.replaceState({}, document.title, "/");
}

/**
 * Парсит roles из profile. Поддерживает 3 источника (по убывающей приоритету):
 *   1. namespaced `https://eios/roles` (Auth0 mock)
 *   2. без namespace `roles` (будущий реальный Univerkon)
 *   3. legacy `https://eios/role` (одиночная строка, старая модель — backward compat)
 *
 * Неизвестные роли отфильтровываются (не падает). Модификаторы пропускаются как есть.
 */
function parseRoles(profile: Record<string, unknown>): Role[] {
  const raw =
    (profile["https://eios/roles"] as unknown) ??
    (profile.roles as unknown) ??
    null;

  if (Array.isArray(raw)) {
    return raw
      .filter((r): r is { name: string; modifiers?: unknown } =>
        typeof r === "object" && r !== null && typeof (r as { name?: unknown }).name === "string")
      .filter((r) => KNOWN_ROLES.has(r.name as RoleName))
      .map((r) => ({
        name:      r.name as RoleName,
        modifiers: Array.isArray(r.modifiers)
          ? r.modifiers.filter((m): m is string => typeof m === "string")
          : undefined,
      }));
  }

  // Legacy одиночная роль
  const legacy = profile["https://eios/role"];
  if (typeof legacy === "string" && KNOWN_ROLES.has(legacy as RoleName)) {
    return [{ name: legacy as RoleName }];
  }

  return [];
}

export async function getUser(): Promise<PersonIdentity | null> {
  const u = await mgr.getUser();
  if (!u || u.expired) return null;
  const p = u.profile as Record<string, unknown>;

  const familyName = (p.family_name as string | undefined) ?? "";
  const givenName  = (p.given_name  as string | undefined) ?? "";
  const middleName = (p.middle_name as string | undefined) ?? undefined;
  const name = (p.name as string | undefined)
    ?? [familyName, givenName, middleName].filter(Boolean).join(" ");
  const eiv = (p["https://eios/eiv"] as string | undefined)
    ?? (p["eiv"] as string | undefined)
    ?? "";

  return {
    sub: u.profile.sub,
    name,
    givenName,
    familyName,
    middleName,
    eiv,
    roles: parseRoles(p),
  };
}

/** Свежий id_token (JWT) для отправки в Authorization: Bearer.
 *  Не access_token — у Auth0 SPA без API-audience access_token opaque,
 *  не валидируется как JWT. id_token всегда JWT, содержит все наши claims
 *  (https://eios/roles, https://eios/eiv). */
export async function token(): Promise<string | null> {
  const u = await mgr.getUser();
  if (!u || u.expired || !u.id_token) return null;
  return u.id_token;
}
