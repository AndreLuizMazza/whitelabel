/**
 * Gera metadados de versão/build consumidos pelo frontend.
 * Executado em predev / prebuild — não editar src/generated/appMeta.js manualmente.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const pkgPath = resolve(root, "package.json");
const outDir = resolve(root, "src", "generated");
const outPath = resolve(outDir, "appMeta.js");

const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
const version = String(pkg.version || "0.0.0").trim();
const buildIso = new Date().toISOString();

await mkdir(outDir, { recursive: true });

const contents = `// Gerado por scripts/generate-app-meta.mjs — não editar manualmente.
export const APP_VERSION = ${JSON.stringify(version)};
export const APP_BUILD_ISO = ${JSON.stringify(buildIso)};
`;

await writeFile(outPath, contents, "utf8");

console.log(`[app-meta] v${version} · build ${buildIso}`);
