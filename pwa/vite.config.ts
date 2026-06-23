import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // manifest читается из public/manifest.webmanifest — не дублируем здесь.
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html}"],
        runtimeCaching: [
          {
            // SCORM-пакеты: кешируем агрессивно (CacheFirst) — контент статичен.
            // §6.1: курс должен грузиться без 1С вообще.
            urlPattern: /\/scorm\/.+/,
            handler: "CacheFirst",
            options: {
              cacheName: "scorm-packages",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],

  server: {
    proxy: {
      // dev-режим: /api/* → glue на localhost:8080
      "/api": { target: "http://localhost:8080", rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
});
