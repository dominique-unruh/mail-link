import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const version: string = packageJson.version;

// Compile TypeScript
execSync("tsc", { stdio: "inherit" });

// Copy static files
copyFileSync("src/icon.svg",     "dist/icon.svg");
copyFileSync("src/options.html", "dist/options.html");

// Copy manifest.json with version substituted
const manifest = JSON.parse(readFileSync("src/manifest.json", "utf8"));
manifest.version = version;
writeFileSync("dist/manifest.json", JSON.stringify(manifest, null, 2));

console.log(`Built version ${version}`);