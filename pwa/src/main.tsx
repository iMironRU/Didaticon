import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.js";
import { handleCallback } from "./auth/oidc.js";

async function bootstrap() {
  // OIDC redirect возвращается на /callback?code=...&state=...
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
