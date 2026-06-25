// OIDC против Univerkon (provider реализован на стороне Univerkon).
// Токен = личность + грубые роли; точечные права разрешает контур (§15.8).
// docs/concept-eios.md §3.
import { UserManager, WebStorageStateStore } from "oidc-client-ts";
import { StudentId } from "@eios/contracts";
import { config } from "../config.js";

const mgr = new UserManager({
  authority: config.oidcIssuer,
  client_id: config.oidcClientId,
  redirect_uri: window.location.origin + "/callback",
  post_logout_redirect_uri: window.location.origin + "/",
  // Univerkon выдаёт access_token с audience=eios-glue; нам нужны openid+profile
  // для sub/имени, остальное Univerkon добавляет по client-конфигу.
  scope: "openid profile",
  response_type: "code", // code + PKCE по умолчанию в oidc-client-ts
  loadUserInfo: false,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});

export async function login(): Promise<void> {
  await mgr.signinRedirect();
}

export async function logout(): Promise<void> {
  await mgr.signoutRedirect();
}

/** Вызывается из main.tsx при заходе на /callback. */
export async function handleCallback(): Promise<void> {
  await mgr.signinRedirectCallback();
  // Чистим query-string (?code=...&state=...) из URL, чтобы не светилось при F5.
  window.history.replaceState({}, document.title, "/");
}

export async function getStudent(): Promise<{ id: StudentId } | null> {
  const u = await mgr.getUser();
  if (!u || u.expired) return null;
  return { id: StudentId(u.profile.sub) };
}

/** Свежий access_token (или null) для отправки клею в credential. */
export async function token(): Promise<string | null> {
  const u = await mgr.getUser();
  if (!u || u.expired || !u.access_token) return null;
  return u.access_token;
}
