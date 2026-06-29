export interface Branding {
  orgName: string;
  brandColor: string;
  logoUrl: string | null;
  lkUrl: string | null;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  accessInfo: string;
  footerText: string;
  oidcEnabled: boolean;
  demoEnabled: boolean;
  /** Название ID физлица в этой ОО — "ЕИВ" / "Студ. код" / "UID" / ...
   *  Пустая строка → используется локализованный дефолт из locale.ts (`eivLabel`). */
  personIdLabel: string;
}

declare global {
  interface Window {
    __EIOS_CONFIG__?: {
      oidcIssuer: string;
      oidcClientId: string;
      branding?: Partial<Branding>;
    };
  }
}

export const DEFAULT_BRANDING: Branding = {
  orgName:      "Образовательная организация",
  brandColor:   "#4B9EE5",
  logoUrl:      null,
  lkUrl:        null,
  supportEmail: "",
  supportPhone: "",
  supportHours: "",
  accessInfo:   "<p>Доступ к ЭИОС предоставляется учебной частью при зачислении.</p><p>Если вы уже обучаетесь, но не можете войти — обратитесь в деканат или службу поддержки.</p>",
  footerText:   "",
  oidcEnabled:  true,
  demoEnabled:  false,
  personIdLabel: "",
};

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
