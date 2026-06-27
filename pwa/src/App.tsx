import { useEffect, useState } from "react";
import type { StudentId } from "@eios/contracts";
import { login, getStudent } from "./auth/oidc.js";
import { Trajectory } from "./projections/trajectory.js";
import { DEFAULT_BRANDING, type Branding } from "./config.js";

type AuthState =
  | { phase: "checking" }
  | { phase: "anonymous" }
  | { phase: "logging_in" }
  | { phase: "error"; message: string }
  | { phase: "authenticated"; studentId: StudentId };

const USE_MOCK = import.meta.env.DEV || new URLSearchParams(window.location.search).has("demo");

export function App() {
  const [auth, setAuth] = useState<AuthState>(
    USE_MOCK ? { phase: "authenticated", studentId: "s-mock" as StudentId } : { phase: "checking" }
  );
  const [remoteBranding, setRemoteBranding] = useState<Partial<Branding>>({});

  useEffect(() => {
    fetch("/api/branding")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        const patch: Partial<Branding> = {};
        if (d.accessInfo  != null) patch.accessInfo  = d.accessInfo;
        if (d.oidcEnabled != null) patch.oidcEnabled = d.oidcEnabled;
        if (d.logoUrl     != null) patch.logoUrl     = d.logoUrl;
        if (d.lkUrl       != null) patch.lkUrl       = d.lkUrl;
        if (d.orgName     != null) patch.orgName     = d.orgName;
        if (d.brandColor  != null) patch.brandColor  = d.brandColor;
        if (d.supportEmail != null) patch.supportEmail = d.supportEmail;
        if (d.supportPhone != null) patch.supportPhone = d.supportPhone;
        if (d.supportHours != null) patch.supportHours = d.supportHours;
        if (d.footerText  != null) patch.footerText  = d.footerText;
        setRemoteBranding(patch);
        // Применяем акцентный цвет как CSS-переменную
        if (d.brandColor && /^#[0-9a-fA-F]{6}$/.test(d.brandColor)) {
          document.documentElement.style.setProperty("--c-accent", d.brandColor);
        }
        // Обновляем фавикон если организация задала свой логотип
        if (d.logoUrl) {
          const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
          if (link) link.href = d.logoUrl;
        }
      })
      .catch(() => {});
    if (USE_MOCK) return;
    getStudent()
      .then((s) => {
        if (s) {
          const returnHash = sessionStorage.getItem("eios_return_hash");
          if (returnHash) { sessionStorage.removeItem("eios_return_hash"); window.location.hash = returnHash; }
          setAuth({ phase: "authenticated", studentId: s.id });
        } else {
          setAuth({ phase: "anonymous" });
        }
      })
      .catch(() => setAuth({ phase: "anonymous" }));
  }, []);

  function handleLogout() {
    sessionStorage.clear();
    setAuth({ phase: "anonymous" });
  }

  async function handleLogin() {
    setAuth({ phase: "logging_in" });
    // Сохраняем хеш чтобы восстановить экран после OIDC-редиректа
    if (window.location.hash && window.location.hash !== "#/") {
      sessionStorage.setItem("eios_return_hash", window.location.hash);
    }
    try {
      await login();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAuth({ phase: "error", message: msg });
    }
  }

  const branding: Branding = {
    ...DEFAULT_BRANDING,
    ...(window.__EIOS_CONFIG__?.branding ?? {}),
    ...remoteBranding,
  };

  if (auth.phase === "authenticated") {
    return <Trajectory studentId={auth.studentId} onLogout={handleLogout} lkUrl={branding.lkUrl ?? undefined} />;
  }

  return <LoginScreen auth={auth} onLogin={handleLogin} branding={branding} />;
}

function LoginScreen({
  auth,
  onLogin,
  branding,
}: {
  auth: AuthState;
  onLogin: () => void;
  branding: Branding;
}) {
  const [screen, setScreen] = useState<"login" | "access">("login");
  const b = branding.brandColor;
  const isLoading = auth.phase === "checking" || auth.phase === "logging_in";
  const hasError = auth.phase === "error";
  const oidcReady = branding.oidcEnabled;
  const loginDisabled = isLoading || !oidcReady;

  if (screen === "access") {
    return <AccessScreen branding={branding} onBack={() => setScreen("login")} />;
  }

  const footer = branding.footerText || ("© " + new Date().getFullYear() + " " + branding.orgName + " · ЭИОС");

  return (
    <div style={r.root}>
      <div style={r.inner}>

        <div style={{ ...r.logoWrap, border: "0.5px solid " + hex20(b) }}>
          {branding.logoUrl
            ? <img src={branding.logoUrl} alt="Логотип" style={{ width: 52, height: 52, objectFit: "contain" }} />
            : <SchoolIcon color={b} />
          }
        </div>

        <p style={r.orgName}>{branding.orgName}</p>
        <h1 style={r.title}>ЭИОС</h1>
        <p style={r.subtitle}>Электронная информационно-образовательная среда</p>

        <button
          style={{ ...r.btn, background: loginDisabled ? hex80(b) : b, cursor: loginDisabled ? "not-allowed" : "pointer" }}
          onClick={loginDisabled ? undefined : onLogin}
          disabled={loginDisabled}
          title={!oidcReady ? "Авторизация не настроена — обратитесь к администратору" : undefined}
        >
          {isLoading
            ? <><span style={r.spin} />{auth.phase === "checking" ? "Проверка сессии…" : "Выполняется вход…"}</>
            : <><LoginIcon />{!oidcReady ? "Войти (не настроено)" : auth.phase === "error" ? "Попробовать снова" : "Войти"}</>
          }
        </button>

        <button
          style={{ ...r.demoBtn, borderColor: hex20(b), color: hex80(b) }}
          onClick={() => { window.location.href = window.location.pathname + "?demo=1"; }}
        >
          <DemoIcon /> Демо-режим
        </button>

        {!oidcReady && (
          <div style={r.warnBox}>
            Авторизация через Univerkon не настроена. Войдите в <a href="/admin" style={{ color: "#E0A070" }}>админ-панель</a> и укажите OIDC-параметры.
          </div>
        )}

        {hasError && (
          <div style={r.errorBox}>
            Не удалось подключиться к серверу авторизации. Попробуйте позже или обратитесь в поддержку.
          </div>
        )}

        {(branding.supportEmail || branding.supportPhone || branding.supportHours) && (
          <div style={{ ...r.section, borderColor: hex20(b) }}>
            <p style={{ ...r.sectionLabel, color: hex80(b) }}>Служба поддержки</p>
            {branding.supportEmail && (
              <ContactRow icon="mail">
                <a href={"mailto:" + branding.supportEmail} style={{ color: b }}>{branding.supportEmail}</a>
              </ContactRow>
            )}
            {branding.supportPhone && <ContactRow icon="phone">{branding.supportPhone}</ContactRow>}
            {branding.supportHours && <ContactRow icon="clock">{branding.supportHours}</ContactRow>}
          </div>
        )}

        <button style={{ ...r.accessLink, color: b }} onClick={() => setScreen("access")}>
          Как получить доступ <span style={{ fontSize: 16 }}>›</span>
        </button>

        <p style={r.footer}>{footer}</p>
        <p style={r.versionLabel}>
          v{typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.1.0"}
          {typeof __COMMIT_HASH__ !== "undefined" && __COMMIT_HASH__ ? ` · ${__COMMIT_HASH__}` : ""}
        </p>
      </div>
    </div>
  );
}

function AccessScreen({ branding, onBack }: { branding: Branding; onBack: () => void }) {
  const b = branding.brandColor;

  return (
    <div style={r.root}>
      <div style={r.inner}>
        <div style={r.accessHeader}>
          <button style={{ ...r.backBtn, color: b }} onClick={onBack}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>‹</span> Назад
          </button>
          <h1 style={{ ...r.title, fontSize: "1.2rem", marginTop: 10, textAlign: "left" }}>
            Как получить доступ
          </h1>
        </div>

        <div style={{ ...r.section, borderColor: hex20(b) }}>
          <p style={{ ...r.sectionLabel, color: hex80(b) }}>Для студентов</p>
          <div
            className="access-html"
            style={r.accessText}
            dangerouslySetInnerHTML={{ __html: branding.accessInfo }}
          />
        </div>

        {(branding.supportEmail || branding.supportPhone || branding.supportHours) && (
          <div style={{ ...r.section, borderColor: hex20(b) }}>
            <p style={{ ...r.sectionLabel, color: hex80(b) }}>Контакты</p>
            {branding.supportEmail && (
              <ContactRow icon="mail">
                <a href={"mailto:" + branding.supportEmail} style={{ color: b }}>{branding.supportEmail}</a>
              </ContactRow>
            )}
            {branding.supportPhone && <ContactRow icon="phone">{branding.supportPhone}</ContactRow>}
            {branding.supportHours && <ContactRow icon="clock">{branding.supportHours}</ContactRow>}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactRow({ icon, children }: { icon: "mail" | "phone" | "clock"; children: React.ReactNode }) {
  return (
    <div style={r.contactRow}>
      <span style={r.contactIcon}>{icon === "mail" ? "✉" : icon === "phone" ? "✆" : "◷"}</span>
      <span style={r.contactText}>{children}</span>
    </div>
  );
}

function DemoIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginRight: 7, verticalAlign: -2 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>;
}
function LogoutIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function SchoolIcon({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4"/>
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ marginRight: 8, verticalAlign: -3 }} aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
}
function hex80(hex: string): string { return hexToRgba(hex, 0.8); }
function hex20(hex: string): string { return hexToRgba(hex, 0.2); }

const r: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100dvh",
    background: "#091629",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "0 0 32px",
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    overflowY: "auto",
  },
  inner: {
    width: "100%",
    maxWidth: 420,
    padding: "48px 24px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 20,
    background: "#0F2545",
    border: "0.5px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  orgName: {
    color: "#7FA4CC",
    fontSize: "0.75rem",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 1.4,
  },
  title: {
    color: "#fff",
    fontSize: "1.75rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    margin: "0 0 6px",
    textAlign: "center",
  },
  subtitle: {
    color: "#4D7BA8",
    fontSize: "0.75rem",
    textAlign: "center",
    lineHeight: 1.5,
    maxWidth: 220,
    margin: "0 0 28px",
  },
  btn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    padding: "14px 20px",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
    letterSpacing: "0.02em",
  },
  spin: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin .8s linear infinite",
    display: "inline-block",
    marginRight: 10,
    flexShrink: 0,
  },
  demoBtn: {
    marginTop: 10,
    width: "100%",
    background: "none",
    border: "0.5px solid",
    borderRadius: 10,
    fontSize: "0.88rem",
    fontWeight: 500,
    padding: "11px 20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "0.02em",
  },
  warnBox: {
    marginTop: 12,
    width: "100%",
    background: "#1A1208",
    border: "0.5px solid #4A3010",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#C09050",
    fontSize: "0.78rem",
    lineHeight: 1.5,
  },
  errorBox: {
    marginTop: 12,
    width: "100%",
    background: "#180E0E",
    border: "0.5px solid #4A1F1F",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#E07070",
    fontSize: "0.8rem",
    lineHeight: 1.5,
  },
  section: {
    marginTop: 16,
    width: "100%",
    background: "#0F2545",
    borderRadius: 10,
    border: "0.5px solid",
    padding: "12px 14px",
  },
  sectionLabel: {
    fontSize: "0.65rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 8,
    fontWeight: 500,
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "5px 0",
    borderTop: "0.5px solid #152A4A",
  },
  contactIcon: {
    color: "#4D7BA8",
    fontSize: "0.9rem",
    width: 16,
    textAlign: "center",
    flexShrink: 0,
  },
  contactText: {
    color: "#7FA4CC",
    fontSize: "0.8rem",
  },
  accessLink: {
    marginTop: 16,
    background: "none",
    border: "none",
    fontSize: "0.85rem",
    cursor: "pointer",
    padding: "4px 0",
  },
  accessHeader: {
    width: "100%",
    borderBottom: "0.5px solid #1A3560",
    paddingBottom: 16,
    marginBottom: 4,
  },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: 0,
  },
  accessText: {
    color: "#7FA4CC",
    fontSize: "0.82rem",
    lineHeight: 1.6,
    margin: 0,
  },
  footer: {
    marginTop: 20,
    color: "#2A4A6A",
    fontSize: "0.65rem",
    textAlign: "center",
    lineHeight: 1.6,
  },
  versionLabel: {
    marginTop: 12,
    color: "#1E3A5F",
    fontSize: "0.6rem",
    textAlign: "center",
    letterSpacing: "0.04em",
  },
};
