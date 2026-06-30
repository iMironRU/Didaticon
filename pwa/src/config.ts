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

// Резервное хранилище конфига для offline-cold-start.
//
// Цепочка fallback'ов (в порядке убывания свежести):
//   1. window.__EIOS_CONFIG__   ← /config.js (свежий, генерится nginx'ом)
//   2. localStorage             ← последний успешный config с прошлой сессии
//   3. import.meta.env          ← билд-тайм фолбэк (обычно пустой в prod)
//
// Без (2) при offline-cold-start, когда SW не успел закешировать /config.js
// (например, очень первый запуск без сети — крайний случай), OIDC issuer
// оставался "", UserManager ломался, useAuth уходил в anonymous.

const LS_CONFIG_KEY = "eios_config_v1";
const _envDefaults = { oidcIssuer: "", oidcClientId: "eios-pwa" };

interface PersistedConfig { oidcIssuer: string; oidcClientId: string; branding?: Partial<Branding> }

function readPersistedConfig(): PersistedConfig | null {
  try {
    const raw = localStorage.getItem(LS_CONFIG_KEY);
    return raw ? JSON.parse(raw) as PersistedConfig : null;
  } catch { return null; }
}
function writePersistedConfig(c: PersistedConfig): void {
  try { localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(c)); } catch { /* */ }
}

const _liveConfig = window.__EIOS_CONFIG__;
const _persisted  = readPersistedConfig();

export const config: { oidcIssuer: string; oidcClientId: string } =
  _liveConfig != null
    ? _liveConfig
    : _persisted != null
      ? { oidcIssuer: _persisted.oidcIssuer, oidcClientId: _persisted.oidcClientId }
      : {
          oidcIssuer:   import.meta.env.VITE_OIDC_ISSUER   || _envDefaults.oidcIssuer,
          oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID || _envDefaults.oidcClientId,
        };

// Сохраняем свежий config в LS чтобы следующий offline-cold-start имел fallback.
if (_liveConfig != null && _liveConfig.oidcIssuer) {
  writePersistedConfig({
    oidcIssuer:   _liveConfig.oidcIssuer,
    oidcClientId: _liveConfig.oidcClientId,
    branding:     _liveConfig.branding,
  });
}

/** Branding из persisted config — для useBranding fallback'а. */
export function getPersistedBranding(): Partial<Branding> | null {
  if (_liveConfig?.branding) return _liveConfig.branding;
  return _persisted?.branding ?? null;
}
