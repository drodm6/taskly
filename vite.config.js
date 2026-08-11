import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // a new deploy silently replaces the cached app on next visit —
      // no "update available" prompt to manage
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "Taskly",
        short_name: "Taskly",
        description: "A private, on-device task manager with projects, countdowns, and workspaces.",
        start_url: "/",
        display: "standalone",     // own window, no browser address bar
        background_color: "#0a0a0a",
        theme_color: "#f97316",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          // maskable lets Android crop it into circles/squircles safely
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});