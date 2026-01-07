import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    // Das hier ist der entscheidende Teil:
    alias: {
      // Zwingt alle Pakete, das React aus DEINEM node_modules zu nutzen
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "@db-ux": path.resolve("node_modules/@db-ux"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    outDir: "dist",
    rollupOptions: {
      input: {
        ui: path.resolve(__dirname, "index.html"),
      },
      output: {
        // Sicherstellen, dass alles in einer Datei landet
        inlineDynamicImports: true,
        entryFileNames: "index.js",
      },
    },
  },
});
