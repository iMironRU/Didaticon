import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // PWA: прекеш приложения и статики; SCORM-пакеты кешируются для офлайна.
    VitePWA({
      registerType: "autoUpdate",
      // TODO(срез-1): runtimeCaching для SCORM-пакетов (CacheFirst), см. §6.
      workbox: { globPatterns: ["**/*.{js,css,html}"] },
      manifest: { name: "ЭИОС", short_name: "ЭИОС", display: "standalone" },
    }),
  ],
});
