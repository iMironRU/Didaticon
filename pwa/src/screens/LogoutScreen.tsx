/**
 * LogoutScreen — экран подтверждения выхода (didakticon_design.md §3.5).
 *
 * Показывается ОДИН раз сразу после logout (Auth0 → / с флагом
 * "eios_just_logged_out" в sessionStorage). На любой следующей навигации
 * показывается обычный LoginScreen.
 *
 * Зачем отдельный экран:
 *  1. Подтверждение действия (пользователь видит что вышел успешно)
 *  2. Предупреждение про общий компьютер (приватность)
 *  3. Кнопка "Войти снова" для быстрого возврата
 */
import type { Branding } from "../config.js";
import { Button } from "../ui/Button.js";

interface Props {
  branding: Branding;
  onLoginAgain: () => void;
}

export function LogoutScreen({ branding, onLoginAgain }: Props) {
  const b = branding.brandColor;

  return (
    <main
      id="main-content"
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6"
      style={{ background: "#091629" }}
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ background: "#0F2545", border: `0.5px solid ${b}33` }}
          aria-hidden="true"
        >
          👋
        </div>
        <div>
          <h1 className="text-white text-xl font-medium mb-2">
            Вы вышли из ЭИОС
          </h1>
          <p className="text-[0.85rem]" style={{ color: "#7FA4CC" }}>
            Сессия завершена. Вернитесь когда понадобится.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onLoginAgain}
        >
          Войти снова
        </Button>

        <div
          className="w-full rounded-lg px-4 py-3 text-[0.78rem] leading-relaxed text-left"
          style={{ background: "#0F2545", border: "0.5px solid #1A3560", color: "#7FA4CC" }}
        >
          <span aria-hidden="true">⚠</span> <span style={{ color: "#A9C5E0" }}>Если устройство общее</span> —
          закройте вкладку браузера, чтобы посторонние не получили доступ к вашему профилю.
        </div>
      </div>
    </main>
  );
}
