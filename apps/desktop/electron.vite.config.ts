import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    envDir: repoRoot,
    server: {
      host: "127.0.0.1",
      port: 5174,
    },
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer"),
      },
    },
    plugins: [react()],
  },
});
