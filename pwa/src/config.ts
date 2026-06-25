declare global {
  interface Window {
    __EIOS_CONFIG__?: { oidcIssuer: string; oidcClientId: string };
  }
}

export const config = window.__EIOS_CONFIG__ ?? {
  oidcIssuer: import.meta.env.VITE_OIDC_ISSUER ?? "",
  oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID ?? "eios-pwa",
};
