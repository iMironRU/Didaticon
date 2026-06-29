/**
 * Экраны входа: LoginScreen + AccessScreen + контактные блоки.
 *
 * Использует inline-стили (CSS-переменные не подходят — экран входа
 * имеет собственный тёмный фон независимо от темы PWA).
 */
import { useState } from "react";
import type { AuthState } from "../../auth/useAuth.js";
import { loginAs } from "../../auth/oidc.js";
import type { Branding } from "../../config.js";
import { Spinner } from "../../ui/Spinner.js";

interface Props {
  auth:    AuthState;
  onLogin: () => void;
  branding: Branding;
}

export function LoginScreen({ auth, onLogin, branding }: Props) {
  const [screen, setScreen] = useState<"login" | "access">("login");
  // Меняем подпись для тех кто уже залогинился — он не основная аудитория
  // демо-блока (см. didakticon_design.md §3.4 "Жизненный цикл демо").
  const hasLoggedInBefore = localStorage.getItem("eios_has_logged_in_before") === "1";
  const [pwCopied, setPwCopied] = useState(false);
  const b = branding.brandColor;
  const isLoading = auth.phase === "checking" || auth.phase === "logging_in";
  const hasError = auth.phase === "error";
  const oidcReady = branding.oidcEnabled;
  const loginDisabled = isLoading || !oidcReady;

  const DEMO_USERS = [
    { label: "👨‍🎓 Студент",  email: "student@didacticon.test" },
    { label: "👨‍👧 Родитель", email: "parent@didacticon.test"  },
    { label: "👨‍🏫 Педагог",  email: "teacher@didacticon.test" },
  ];

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
            ? <><Spinner size={16} className="mr-2.5" />{auth.phase === "checking" ? "Проверка сессии…" : "Выполняется вход…"}</>
            : <><LoginIcon />{!oidcReady ? "Войти (не настроено)" : auth.phase === "error" ? "Попробовать снова" : "Войти"}</>
          }
        </button>

        {/* Демо-вход через Auth0 (только если demoEnabled).
            Раньше был аккордеон, теперь — просто секция: 3 кнопки сверху,
            подсказка с паролем под ними. См. didakticon_design.md §3.4. */}
        {branding.demoEnabled && (
          <div style={r.demoLoginBlock}>
            <div style={{ ...r.demoLoginLabel, color: hex80(b) }}>
              {hasLoggedInBefore ? "Демо других ролей" : "Демо-вход для ознакомления"}
            </div>
            <div style={r.demoLoginBtns}>
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  style={{ ...r.demoRoleBtn, borderColor: hex20(b), color: hex80(b) }}
                  onClick={() => loginAs(u.email)}
                >
                  {u.label}
                </button>
              ))}
            </div>
            <p style={r.demoLoginHint}>
              Пароль для всех:{" "}
              <code style={{ color: b }}>Test1234!</code>
              <button
                style={r.copyBtn}
                onClick={() => {
                  navigator.clipboard.writeText("Test1234!").then(() => {
                    setPwCopied(true);
                    setTimeout(() => setPwCopied(false), 1500);
                  });
                }}
              >
                {pwCopied ? "✓" : "⧉"}
              </button>
            </p>
          </div>
        )}

        {!oidcReady && <ConfigWarning />}

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

/**
 * ConfigWarning — плавающий "!" в правом верхнем углу.
 * Клик → раскрывается влево с полным сообщением и ссылкой на админку.
 * Только для админов/разработчиков, обычный юзер этой кнопки не видит
 * (потому что OIDC уже настроен).
 */
function ConfigWarning() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row-reverse" }}>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Конфигурация не задана"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#4A3010", border: "0.5px solid #6A4818",
            color: "#E0A070", fontSize: "1.1rem", fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >!</button>
        {open && (
          <div style={{
            background: "#1A1208", border: "0.5px solid #4A3010", borderRadius: 8,
            padding: "10px 14px", color: "#C09050",
            fontSize: "0.78rem", lineHeight: 1.5, width: 260,
            boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}>
            Авторизация через Univerkon не настроена. Войдите в{" "}
            <a href="/admin" style={{ color: "#E0A070" }}>админ-панель</a>
            {" "}и укажите OIDC-параметры.
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
  demoRoleBtn: {
    flex: 1,
    background: "none",
    border: "0.5px solid",
    borderRadius: 10,
    fontSize: "0.88rem",
    fontWeight: 500,
    padding: "11px 0",
    cursor: "pointer",
  },
  demoLoginBlock: {
    marginTop: 8,
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 0,
  },
  demoLoginLabel: {
    fontSize: "0.7rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    fontWeight: 600,
    marginBottom: 8,
    textAlign: "center" as const,
  },
  demoLoginHint: {
    fontSize: "0.75rem",
    color: "#4D7BA8",
    textAlign: "center" as const,
    marginTop: 8,
  },
  demoLoginBtns: {
    display: "flex",
    flexDirection: "row" as const,
    gap: 8,
  },
  copyBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    opacity: 0.7,
    padding: "0 4px",
    verticalAlign: "middle",
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
