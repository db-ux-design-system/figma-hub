#!/usr/bin/env node
/**
 * Export selected db-* Figma plugins to a target directory.
 *
 * Usage:
 *   node scripts/export-plugins.mjs <target-dir> [plugin-name ...]
 *
 * Examples:
 *   node scripts/export-plugins.mjs ~/figma-plugins db-figma-migrate db-figma-release
 *   node scripts/export-plugins.mjs ~/figma-plugins --all
 */
import {
  readFileSync,
  writeFileSync,
  cpSync,
  mkdirSync,
  readdirSync,
  existsSync,
} from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PACKAGES = join(ROOT, "packages");

// Simple .env loader (no dependency needed)
try {
  const envFile = readFileSync(join(ROOT, ".env"), "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  /* no .env file — that's fine */
}

const DEFAULT_TARGET = process.env.PLUGIN_EXPORT_DIR
  ? resolve(process.env.PLUGIN_EXPORT_DIR)
  : join(ROOT, "dist-plugins");

function getPluginDirs() {
  return readdirSync(PACKAGES, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter(
      (name) =>
        name.startsWith("db-") &&
        existsSync(join(PACKAGES, name, "manifest.json")),
    );
}

function exportPlugin(pluginName, targetBase) {
  const srcDir = join(PACKAGES, pluginName);
  const manifestPath = join(srcDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    console.error(`  ✗ ${pluginName}: manifest.json not found`);
    return false;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const destDir = join(targetBase, pluginName);
  const files = ["manifest.json"];
  if (manifest.main) files.push(manifest.main);
  if (manifest.ui) files.push(manifest.ui);
  for (const file of files) {
    if (!existsSync(join(srcDir, file))) {
      console.error(`  ✗ ${pluginName}: missing ${file} — run build first`);
      return false;
    }
  }
  mkdirSync(destDir, { recursive: true });
  for (const file of files) {
    const src = join(srcDir, file);
    const dest = join(destDir, file);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
  }
  // Replace or prepend icon and add [TEST] prefix in the copied manifest
  const destManifest = join(destDir, "manifest.json");
  const m = JSON.parse(readFileSync(destManifest, "utf8"));
  // Strip any leading emoji (including variation selectors / ZWJ sequences)
  const stripped = m.name
    .replace(
      /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u,
      "",
    )
    .trim();
  m.name = `📦 ${stripped}`;
  writeFileSync(destManifest, JSON.stringify(m, null, 2) + "\n");

  console.log(`  ✓ ${pluginName} → ${destDir}`);
  return true;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(
    "Usage: node scripts/export-plugins.mjs [target-dir] [plugin ...] [--all]",
  );
  console.log(`\nDefault target: ${DEFAULT_TARGET}`);
  console.log("\nAvailable plugins:");
  for (const name of getPluginDirs()) console.log(`  - ${name}`);
  process.exit(0);
}

// First arg is target dir if it doesn't look like a plugin name, otherwise use default
let targetDir = DEFAULT_TARGET;
let pluginArgs = args;

if (args.length > 0 && !args[0].startsWith("db-") && args[0] !== "--all") {
  targetDir = resolve(args[0]);
  pluginArgs = args.slice(1);
}
const exportAll = pluginArgs.includes("--all");
const plugins = exportAll ? getPluginDirs() : pluginArgs;

if (plugins.length === 0) {
  console.log("No plugins specified. Use --all or list plugin names.");
  console.log("\nAvailable plugins:");
  for (const name of getPluginDirs()) console.log(`  - ${name}`);
  process.exit(1);
}

console.log(`Exporting ${plugins.length} plugin(s) to ${targetDir}\n`);
let success = 0;
for (const name of plugins) {
  if (exportPlugin(name, targetDir)) success++;
}
console.log(`\nDone: ${success}/${plugins.length} exported.`);
