/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: https://charrixxz23.github.io/panama-swim-demo/
const base = process.env.BASE_PATH ?? "/panama-swim-demo/";
const siteUrl = (process.env.SITE_URL ?? "https://charrixxz23.github.io/panama-swim-demo/").replace(/\/?$/, "/");

export default defineConfig({
  base,
  plugins: [
    react(),
    { name: "site-url", transformIndexHtml: (html) => html.replaceAll("__SITE_URL__", siteUrl) },
  ],
  build: {
    target: "es2020",
    // El índice incluye el conjunto de datos demostrativo (~380 kB sin comprimir, ~52 kB con gzip).
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: { react: ["react", "react-dom", "react-router-dom"], charts: ["recharts"] },
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
});
