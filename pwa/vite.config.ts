import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";
import { execSync } from "child_process";
const { version } = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };
const commitHash = (process.env.COMMIT_HASH || (() => { try { return execSync("git rev-parse --short HEAD").toString().trim(); } catch { return "dev"; } })()).slice(0, 7);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  // es2019 = до ES2020, где появились ?? и ?. — esbuild транспилирует их в совместимый код.
  // Покрывает Safari 12+ (iOS 12), Chrome 69+. Async/await остаётся нативным.
  build: {
    target: "es2019",
    // terser уважает зарезервированные слова JS (of, in, let...) при манглинге имён.
    // esbuild по умолчанию переименовывает классы в зарезервированные слова,
    // что ломает парсер Safari < 15.
    minify: "terser",
    terserOptions: {
      mangle: { reserved: ["of", "in", "do", "if", "for", "let", "new", "try", "var"] },
    },
  },
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
