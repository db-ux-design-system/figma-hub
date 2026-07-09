import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: "build-time",
      transform(code, id) {
        if (id.endsWith(".tsx") || id.endsWith(".ts")) {
          return code.replaceAll(
            "__BUILD_TIME__",
            JSON.stringify(
              new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" }),
            ),
          );
        }
      },
    },
  ],
  build: {
    target: "esnext",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    outDir: "../dist",
    rollupOptions: {
      output: {},
    },
  },
  resolve: {
    alias: {
      "@db-ux": path.resolve(__dirname, "../../../node_modules/@db-ux"),
    },
  },
});
