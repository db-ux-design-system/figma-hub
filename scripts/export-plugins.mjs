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

const LOCAL_TARGET = join(ROOT, "dist-plugins");
const SHAREPOINT_TARGET = process.env.PLUGIN_EXPORT_DIR
  ? resolve(process.env.PLUGIN_EXPORT_DIR)
  : null;

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
  console.log("Usage: node scripts/export-plugins.mjs [plugin ...] [--all]");
  console.log(`\nTargets:`);
  console.log(`  Local:      ${LOCAL_TARGET}`);
  console.log(
    `  SharePoint: ${SHAREPOINT_TARGET ?? "(not configured — set PLUGIN_EXPORT_DIR in .env)"}`,
  );
  console.log("\nAvailable plugins:");
  for (const name of getPluginDirs()) console.log(`  - ${name}`);
  process.exit(0);
}

const pluginArgs = args.filter((a) => !a.startsWith("-"));
const exportAll = args.includes("--all");
const plugins = exportAll ? getPluginDirs() : pluginArgs;

if (plugins.length === 0) {
  console.log("No plugins specified. Use --all or list plugin names.");
  console.log("\nAvailable plugins:");
  for (const name of getPluginDirs()) console.log(`  - ${name}`);
  process.exit(1);
}

// Build list of targets
const targets = [LOCAL_TARGET];
if (SHAREPOINT_TARGET) {
  if (existsSync(SHAREPOINT_TARGET)) {
    targets.push(SHAREPOINT_TARGET);
  } else {
    console.warn(
      `⚠ SharePoint folder not found (not synced?): ${SHAREPOINT_TARGET}\n`,
    );
  }
}

let totalSuccess = 0;
for (const targetDir of targets) {
  console.log(`→ ${targetDir}\n`);
  for (const name of plugins) {
    if (exportPlugin(name, targetDir)) totalSuccess++;
  }
  console.log();
}
console.log(
  `Done: ${totalSuccess} export(s) across ${targets.length} target(s).`,
);
