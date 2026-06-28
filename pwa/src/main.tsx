import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.js";
import { handleCallback } from "./auth/oidc.js";
import { initSwUpdateCheck } from "./sw-update.js";
import { initTheme } from "./theme.js";
import { flush as flushOutbox } from "./offline/outbox.js";

// Когда сеть восстановилась — пробуем досхранить буфер. flush() сам no-op
// если токена нет или буфер пуст; идемпотентен.
window.addEventListener("online", () => { void flushOutbox(); });

async function bootstrap() {
  initTheme();
  initSwUpdateCheck(); // до любого await — иначе controllerchange может прийти раньше
  if (window.location.pathname === "/callback") {
    await handleCallback();
  }
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
