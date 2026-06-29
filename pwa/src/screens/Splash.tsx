/**
 * Splash — экран загрузки в начале сессии и между OIDC callback и AppShell.
 * Показывается пока auth.phase === "checking" — заменяет промежуточный flash
 * LoginScreen'а во время signinRedirectCallback / silent-renew.
 *
 * Дизайн: фикс dark login bg + центральный логотип + spinner снизу +
 * статус-текст. См. didakticon_design.md §3.5 "Splash после OIDC".
 */
import type { Branding } from "../config.js";
import { Spinner } from "../ui/Spinner.js";

interface Props {
  branding: Branding;
  message?: string;
}

export function Splash({ branding, message = "Загрузка ЭИОС…" }: Props) {
  const b = branding.brandColor;
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 gap-6"
         style={{ background: "#091629" }}>
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: "#0F2545", border: `0.5px solid ${b}33` }}
      >
        {branding.logoUrl
          ? <img src={branding.logoUrl} alt="" className="w-12 h-12 object-contain" />
          : <SchoolIcon color={b} />
        }
      </div>
      <div className="flex items-center gap-2.5">
        <Spinner size={18} />
        <span style={{ color: "#7FA4CC" }} className="text-sm">{message}</span>
      </div>
    </div>
  );
}

function SchoolIcon({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4"/>
    </svg>
  );
}
