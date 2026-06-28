import React from "react";
import { createRoot } from "react-dom/client";
import { initTheme } from "../src/theme.js";
import "../src/index.css";
import { AdminApp } from "./App.js";

initTheme();
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
