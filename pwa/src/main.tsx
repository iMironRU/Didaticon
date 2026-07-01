import React from "react";
import ReactDOM, { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.js";
import { handleCallback, handlePopupCallback } from "./auth/oidc.js";
import { initSwUpdateCheck } from "./sw-update.js";
import { initTheme } from "./theme.js";
import { applyPrefs } from "./accessibility/prefs.js";
import { flush as flushOutbox } from "./offline/outbox.js";

// @axe-core/react в DEV — нарушения a11y выводятся в DevTools console
// при каждом рендере. Lint и CI это дополняют, axe-core ловит дин. кейсы.
// (Источник: docs/accessibility/didakticon-accessibility.md §6.1)
if (import.meta.env.DEV) {
  void import("@axe-core/react").then(({ default: axe }) => {
    axe(React, ReactDOM, 1000);
  });
}

// Когда сеть восстановилась — пробуем досхранить буфер. flush() сам no-op
// если токена нет или буфер пуст; идемпотентен.
window.addEventListener("online", () => { void flushOutbox(); });

async function bootstrap() {
  initTheme();
  applyPrefs(); // accessibility-настройки. FOUC-script их тоже выставляет, тут страховка
  initSwUpdateCheck(); // до любого await — иначе controllerchange может прийти раньше
  if (window.location.pathname === "/callback") {
    if (window.opener) {
      // Popup-логин (signinPopup) — родительское окно само закроет эту
      // вкладку, получив postMessage. Не монтируем React — незачем.
      try {
        await handlePopupCallback();
      } catch (e) {
        console.error("[eios] popup callback failed:", e);
        // Авто-закрытие не сработало (нет window.opener или сообщение не
        // дошло) — не оставляем пустой белый экран, объясняем что делать.
        document.body.innerHTML =
          '<p style="font:14px sans-serif;color:#7FA4CC;background:#091629;' +
          'height:100vh;margin:0;display:flex;align-items:center;' +
          'justify-content:center;text-align:center;padding:0 24px;">' +
          "Вход выполнен. Закройте это окно и вернитесь в приложение.</p>";
      }
      return;
    }
    // Флаг "только что вернулись с Auth0" — App.tsx покажет Splash с правильным
    // сообщением, и сам удалит флаг после первого рендера.
    sessionStorage.setItem("eios_was_callback", "1");
    try {
      await handleCallback();
    } catch (e) {
      // Auth code невалиден (однократный PKCE) или SW-reload его "сжёг" раньше.
      // Сбрасываем флаг и отправляем на / — пользователь увидит экран входа
      // и сможет залогиниться снова.
      sessionStorage.removeItem("eios_was_callback");
      console.error("[eios] callback failed, redirecting to login:", e);
      window.history.replaceState({}, document.title, "/");
    }
  }
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
