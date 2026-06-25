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

export function App() {
  const [auth, setAuth] = useState<AuthState>({ phase: "checking" });

  useEffect(() => {
    getStudent()
      .then((s) => setAuth(s ? { phase: "authenticated", studentId: s.id } : { phase: "anonymous" }))
      .catch(() => setAuth({ phase: "anonymous" }));
  }, []);

  async function handleLogin() {
    setAuth({ phase: "logging_in" });
    try {
      await login();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setAuth({ phase: "error", message: msg });
    }
  }

  if (auth.phase === "authenticated") {
    return <Trajectory studentId={auth.studentId} />;
  }

  const branding: Branding = {
    ...DEFAULT_BRANDING,
    ...(window.__EIOS_CONFIG__ && window.__EIOS_CONFIG__.branding
      ? window.__EIOS_CONFIG__.branding
      : {}),
  };

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

  if (screen === "access") {
    return <AccessScreen branding={branding} onBack={() => setScreen("login")} />;
  }

  const footer = branding.footerText || ("© " + new Date().getFullYear() + " " + branding.orgName + " · ЭИОС");

  return (
    <div style={r.root}>
      <div style={r.inner}>

        <div style={{ ...r.logoWrap, borderColor: hex20(b) }}>
          {branding.logoUrl
            ? <img src={branding.logoUrl} alt="Логотип" style={{ width: 52, height: 52, objectFit: "contain" }} />
            : <SchoolIcon color={b} />
          }
        </div>

        <p style={r.orgName}>{branding.orgName}</p>
        <h1 style={r.title}>ЭИОС</h1>
        <p style={r.subtitle}>Электронная информационно-образовательная среда</p>

        <button
          style={{ ...r.btn, background: isLoading ? hex80(b) : b }}
          onClick={onLogin}
          disabled={isLoading}
        >
          {isLoading
            ? <><span style={r.spin} />{auth.phase === "checking" ? "Проверка сессии…" : "Выполняется вход…"}</>
            : <><LoginIcon />{auth.phase === "error" ? "Попробовать снова" : "Войти"}</>
          }
        </button>

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
      </div>
    </div>
  );
}

function AccessScreen({ branding, onBack }: { branding: Branding; onBack: () => void }) {
  const b = branding.brandColor;
  const paragraphs = branding.accessInfo.split("\n\n").filter(Boolean);

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
          {paragraphs.map((p, i) => (
            <p key={i} style={{ ...r.accessText, marginTop: i > 0 ? 10 : 0 }}>{p}</p>
          ))}
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
  },
  footer: {
    marginTop: 20,
    color: "#2A4A6A",
    fontSize: "0.65rem",
    textAlign: "center",
    lineHeight: 1.6,
  },
};
