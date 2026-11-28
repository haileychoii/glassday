import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
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
  const filenames = entries
    .filter((entry) => entry.isFile() && imageExtensions.has(entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
  const imageNames = new Set(filenames.map((entry) => entry.name));
  const orderText = await readFile(resolve(folderPath, "ORDER.txt"), "utf8").catch(() => "");
  const requestedOrder = orderText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && imageNames.has(line));
  const orderedNames = [...new Set(requestedOrder)];
  const orderedSet = new Set(orderedNames);
  const remainingNames = filenames
    .map((entry) => entry.name)
    .filter((name) => !orderedSet.has(name));

  manifest[collection] = [...orderedNames, ...remainingNames].map(
    (filename) => `/workspace-icons/${folder}/${filename}`
  );
}

const source = `/** Generated from public/workspace-icons category folders. Do not edit by hand. */\nexport const workspaceIconManifest = ${JSON.stringify(manifest, null, 2)} as const;\n`;
await mkdir(resolve(projectRoot, "src/generated"), { recursive: true });
await writeFile(outputPath, source);
