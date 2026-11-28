import { mkdir, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const iconRoot = resolve(projectRoot, "public/workspace-icons");
const outputPath = resolve(projectRoot, "src/generated/workspaceIconManifest.ts");

const collections = {
  illustration: "pink-iphone",
  pixel: "retro-pixel",
  "folder-pattern": "folder-art",
  "expressions-hands": "emoji-expressions",
  "people-animals": "emoji-people",
  "nature-food": "emoji-nature",
  "food-travel": "emoji-food-travel",
  "lifestyle-symbols": "emoji-objects",
};
const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);

const manifest = {};
for (const [folder, collection] of Object.entries(collections)) {
  const folderPath = resolve(iconRoot, folder);
  const entries = await readdir(folderPath, { withFileTypes: true });
  manifest[collection] = entries
    .filter((entry) => entry.isFile() && imageExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase()))
    .map((entry) => `/workspace-icons/${folder}/${entry.name}`)
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

const source = `/** Generated from public/workspace-icons category folders. Do not edit by hand. */\nexport const workspaceIconManifest = ${JSON.stringify(manifest, null, 2)} as const;\n`;
await mkdir(resolve(projectRoot, "src/generated"), { recursive: true });
await writeFile(outputPath, source);
