import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.js";
import { handleCallback } from "./auth/oidc.js";
import { initSwUpdateCheck } from "./sw-update.js";

async function bootstrap() {
  if (window.location.pathname === "/callback") {
    await handleCallback();
  }
  initSwUpdateCheck();
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
