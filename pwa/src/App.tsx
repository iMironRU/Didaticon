import { useEffect, useState } from "react";
import type { StudentId } from "@eios/contracts";
import { login, getStudent } from "./auth/oidc.js";
import { Trajectory } from "./projections/trajectory.js";

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

  return <LoginScreen auth={auth} onLogin={handleLogin} />;
}

function LoginScreen({
  auth,
  onLogin,
}: {
  auth: AuthState;
  onLogin: () => void;
}) {
  const isLoading = auth.phase === "checking" || auth.phase === "logging_in";
  const hasError = auth.phase === "error";

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="#1a56db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        <h1 style={s.title}>ЭИОС</h1>
        <p style={s.subtitle}>Электронная информационно-образовательная среда</p>

        <p style={s.hint}>
          Для входа используется учётная запись Univerkon.
          После нажатия кнопки вы будете перенаправлены на страницу входа.
        </p>

        {hasError && (
          <div style={s.errorBox}>
            <strong>Не удалось подключиться к серверу авторизации.</strong>
            <br />
            <span style={{ fontSize: "0.82em", opacity: 0.85 }}>
              {(auth as { phase: "error"; message: string }).message}
            </span>
          </div>
        )}

        <button
          style={{ ...s.btn, ...(isLoading ? s.btnDisabled : {}) }}
          onClick={onLogin}
          disabled={isLoading}
        >
          {auth.phase === "checking"   && "Проверка сессии…"}
          {auth.phase === "logging_in" && "Перенаправление…"}
          {auth.phase === "anonymous"  && "Войти через Univerkon"}
          {auth.phase === "error"      && "Попробовать снова"}
        </button>

        {isLoading && <div style={s.spinner} />}
      </div>

      <p style={s.footer}>
        Возникли проблемы? Обратитесь к администратору системы.
      </p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg,#e8edf8 0%,#f5f7ff 100%)",
    padding: "24px 16px",
    fontFamily: "system-ui,-apple-system,sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(26,86,219,.10)",
    padding: "40px 32px 36px",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
  },
  logoWrap: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eff4ff",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    marginBottom: "20px",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "2rem",
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "0.04em",
  },
  subtitle: {
    margin: "0 0 24px",
    fontSize: "0.9rem",
    color: "#6b7280",
    lineHeight: 1.5,
  },
  hint: {
    margin: "0 0 24px",
    fontSize: "0.88rem",
    color: "#374151",
    lineHeight: 1.6,
    background: "#f9fafb",
    borderRadius: "8px",
    padding: "12px 14px",
    textAlign: "left",
  },
  errorBox: {
    margin: "0 0 20px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#b91c1c",
    fontSize: "0.88rem",
    textAlign: "left",
    lineHeight: 1.5,
  },
  btn: {
    display: "block",
    width: "100%",
    padding: "14px",
    background: "#1a56db",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity .15s",
    letterSpacing: "0.01em",
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "default",
  },
  spinner: {
    margin: "16px auto 0",
    width: "22px",
    height: "22px",
    border: "3px solid #e5e7eb",
    borderTop: "3px solid #1a56db",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  footer: {
    marginTop: "24px",
    fontSize: "0.8rem",
    color: "#9ca3af",
  },
};
