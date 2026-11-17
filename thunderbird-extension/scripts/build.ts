import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { build } from "esbuild";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const version: string = packageJson.version;

// Type-check
execSync("tsc", { stdio: "inherit" });

// Bundle the scripts loaded by the extension (background script and options page),
// including their imports (e.g., the mail-link library).
await build({
  entryPoints: ["src/copy.ts", "src/options.ts"],
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  // Use the mail-link library's TypeScript sources directly (no prior build of the library needed).
  conditions: ["mail-link-source"],
});

// Copy static files
copyFileSync("src/icon.svg",     "dist/icon.svg");
copyFileSync("src/options.html", "dist/options.html");

// Copy manifest.json with version substituted
const manifest = JSON.parse(readFileSync("src/manifest.json", "utf8"));
manifest.version = version;
writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 2));

console.log(`Built version ${version}`);
