/**
 * Брендинг — три источника, мерджатся слева направо (правый перекрывает):
 *
 *   DEFAULT_BRANDING  ←  window.__EIOS_CONFIG__.branding (config.js)
 *                        | fallback: getPersistedBranding() из LS (offline)
 *                        ←  /api/branding (glue)
 *
 * Также применяет акцент-цвет как CSS-переменную и обновляет favicon
 * если организация задала свой логотип.
 */
import { useEffect, useState } from "react";
import { DEFAULT_BRANDING, type Branding, getPersistedBranding } from "../config.js";

export function useBranding(): Branding {
  const [remote, setRemote] = useState<Partial<Branding>>({});

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        const patch: Partial<Branding> = {};
        if (d.accessInfo  != null) patch.accessInfo  = d.accessInfo;
        if (d.oidcEnabled != null) patch.oidcEnabled = d.oidcEnabled;
        if (d.demoEnabled != null) patch.demoEnabled = d.demoEnabled;
        if (d.logoUrl     != null) patch.logoUrl     = d.logoUrl;
        if (d.lkUrl       != null) patch.lkUrl       = d.lkUrl;
        if (d.orgName     != null) patch.orgName     = d.orgName;
        if (d.brandColor  != null) patch.brandColor  = d.brandColor;
        if (d.supportEmail != null) patch.supportEmail = d.supportEmail;
        if (d.supportPhone != null) patch.supportPhone = d.supportPhone;
        if (d.supportHours != null) patch.supportHours = d.supportHours;
        if (d.footerText  != null) patch.footerText  = d.footerText;
        if (d.personIdLabel != null) patch.personIdLabel = d.personIdLabel;
        setRemote(patch);
        if (d.brandColor && /^#[0-9a-fA-F]{6}$/.test(d.brandColor)) {
          document.documentElement.style.setProperty("--c-accent", d.brandColor);
        }
        if (d.logoUrl) {
          const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (link) link.href = d.logoUrl;
        }
      })
      .catch(() => {});
  }, []);

  return {
    ...DEFAULT_BRANDING,
    ...(window.__EIOS_CONFIG__?.branding ?? getPersistedBranding() ?? {}),
    ...remote,
  };
}
