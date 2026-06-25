declare global {
  interface Window {
    __EIOS_CONFIG__?: { oidcIssuer: string; oidcClientId: string };
  }
}

// Версия: v2 — принудительная смена хэша бандла после перехода на runtime config.
export const EIOS_BUNDLE_VER = "v2";

const _defaults = { oidcIssuer: "", oidcClientId: "eios-pwa" };
export const config: { oidcIssuer: string; oidcClientId: string } =
  (window.__EIOS_CONFIG__ != null)
    ? window.__EIOS_CONFIG__
    : {
        oidcIssuer:   import.meta.env.VITE_OIDC_ISSUER   || _defaults.oidcIssuer,
        oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID || _defaults.oidcClientId,
      };
