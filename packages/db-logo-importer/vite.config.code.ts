import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/plugin/code.ts"),
      name: "code",
      formats: ["cjs"],
      fileName: () => "code.js",
    },
    outDir: "dist",
    emptyOutDir: false, // VERHINDERT das Löschen der index.html
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
