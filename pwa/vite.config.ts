import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";
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
    // Multi-page: PWA на /, admin на /admin/. Отдельные бандлы, общий src/.
    rollupOptions: {
      input: {
        main:  resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin/index.html"),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // manifest читается из public/manifest.webmanifest — не дублируем здесь.
      manifest: false,
      workbox: {
        // Прекешируем всё что нужно для холодного офлайн-старта:
        // - html (иначе на iOS PWA при offline-открытии чёрный экран — нет navigation fallback)
        // - js, css, svg/png/ico (иконки, favicon, логотип в shell)
        // - webmanifest (для install metadata)
        // - woff/woff2 (если появятся свои шрифты)
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest,woff,woff2}"],
        // config.js генерируется nginx'ом из env vars при старте контейнера —
        // нельзя кешировать: хеш от placeholder'а не меняется между сборками.
        globIgnores: ["config.js", "**/admin/**"],
        // Без navigateFallback Workbox 404'ит на /performance, /student/.../profile
        // когда сеть отвалилась — SPA-роуты ведь не существуют как файлы.
        // С navigateFallback отдаём index.html и React сам разрулит роутинг.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/api\//,        // RPC и /branding не должны падать в index.html
          /^\/admin/,        // admin это другой бандл, у него свой index.html
          /^\/scorm\//,      // SCORM-пакеты обслуживаются отдельным CacheFirst
          /^\/callback/,     // OIDC-callback обрабатывается main.tsx до рендера
        ],
        runtimeCaching: [
          {
            // /config.js — генерируется nginx'ом при старте контейнера, поэтому
            // ИСКЛЮЧЁН из precache (хэш не меняется). Но index.html синхронно
            // запрашивает его до рендера React: без сети + без runtime cache →
            // window.__EIOS_CONFIG__ undefined → пустой OIDC issuer → useAuth
            // catch → LoginScreen без рабочей авторизации.
            // SWR кеширует первый успешный ответ; меняется только при changes
            // env vars контейнера (редко).
            urlPattern: /\/config\.js$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "runtime-config",
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // /branding — стараемся свежий, иначе из кеша. Без него на холодном
            // оффлайн-старте useBranding падает в catch (default-бренд).
            urlPattern: /\/api\/branding$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "branding",
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // SCORM-пакеты: кешируем агрессивно (CacheFirst) — контент статичен.
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
