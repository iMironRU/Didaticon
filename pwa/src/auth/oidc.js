// OIDC против Univerkon (provider реализован на стороне Univerkon).
// Токен = личность + грубые роли; точечные права разрешает контур (§15.8).
// TODO(срез-1): настроить oidc-client-ts на OIDC_ISSUER Univerkon.
import { UserManager } from "oidc-client-ts";
const mgr = new UserManager({
    authority: import.meta.env.VITE_OIDC_ISSUER ?? "",
    client_id: import.meta.env.VITE_OIDC_CLIENT_ID ?? "eios-pwa",
    redirect_uri: window.location.origin + "/callback",
    scope: "openid profile",
});
export async function login() {
    await mgr.signinRedirect();
}
export async function getStudent() {
    const u = await mgr.getUser();
    return u ? { id: u.profile.sub } : null;
}
export async function token() {
    const u = await mgr.getUser();
    return u?.access_token ?? null;
}
