/**
 * LoginScreen — экран входа в админку.
 *
 * Этап 1: только token (как было). Этап 2 добавит кнопку OIDC выше формы.
 */
import { useState } from "react";
import { setToken, apiFetch } from "./auth.js";
import { Button } from "../src/ui/Button.js";
import { Input } from "../src/ui/Input.js";

interface Props {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [tok, setTok] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const t = tok.trim();
    if (!t) return;
    setError(null);
    setBusy(true);
    setToken(t);
    const r = await apiFetch("/admin/config");
    setBusy(false);
    if (r.ok) {
      onLogin();
    } else {
      setError(r.status === 401 || r.status === 403
        ? "Неверный токен или ADMIN_TOKEN не задан на сервере."
        : `Ошибка ${r.status}: ${r.statusText}`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <svg width="28" height="28" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="#4B9EE5"/>
            <path
              transform="translate(5,5) scale(0.917)"
              d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"
            />
          </svg>
          <h1 className="text-fg text-lg font-bold">ЭИОС — Администрирование</h1>
        </div>

        <p className="text-fg-muted text-sm mb-4">
          Введите ADMIN_TOKEN или, в будущем, войдите через Auth0.
        </p>

        <form
          className="space-y-3"
          onSubmit={e => { e.preventDefault(); void submit(); }}
        >
          <label className="block">
            <span className="block text-fg-muted text-xs mb-1">ADMIN_TOKEN</span>
            <Input
              type="password"
              name="admin-token"
              autoComplete="current-password"
              value={tok}
              onChange={e => setTok(e.target.value)}
              disabled={busy}
              required
              aria-describedby={error ? "admin-login-error" : undefined}
              aria-invalid={error ? true : undefined}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- one-off страница входа, фокус ожидаем
              autoFocus
            />
          </label>
          <Button type="submit" disabled={busy || !tok.trim()} className="w-full">
            {busy ? "Проверка…" : "Войти"}
          </Button>
        </form>

        {error && (
          <div
            id="admin-login-error"
            role="alert"
            className="mt-4 px-3 py-2 bg-[color-mix(in_srgb,var(--c-danger)_10%,transparent)] border border-danger rounded-lg text-danger text-sm"
          >
            {error}
          </div>
        )}

        <p className="text-fg-dim text-xs mt-6 text-center">
          ADMIN_TOKEN задаётся в переменных окружения контейнера glue.
        </p>

        <a
          href="/"
          className="block text-center text-fg-secondary hover:text-fg text-sm no-underline mt-6"
        >
          ← Вернуться в приложение
        </a>
      </div>
    </div>
  );
}
