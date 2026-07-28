import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = resolve(root, "templates/reading-trace.html");
const dataPath = resolve(root, process.argv[2] ?? "data/reading.json");
const outputPath = resolve(root, process.argv[3] ?? "public/experience.html");

const [template, reading] = await Promise.all([
  readFile(templatePath, "utf8"),
  readFile(dataPath, "utf8").then(JSON.parse),
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const panelData = reading.groups.map((group) => ({
  group: group.index,
  title: group.title,
  items: group.items.map((item) => ({
    id: item.id,
    text: item.context,
    strength: reading.roleLabels[item.role],
    initial: null,
  })),
}));

let output = template
  .replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(reading.title)} · 阅迹</title>`,
  )
  .replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeHtml(reading.summary)}">`,
  )
  .replace(
    /<h1 class="title">[\s\S]*?<\/h1>/,
    `<h1 class="title">${escapeHtml(reading.title)}</h1>`,
  )
  .replace(
    /<div class="head-meta">[\s\S]*?<\/div>/,
    `<div class="head-meta">
      <span>${escapeHtml(reading.source.label)}</span>
      <span id="meta-count">— 条命题</span>
    </div>`,
  )
  .replace(
    /<div class="core">[\s\S]*?<\/div>/,
    `<div class="core">
    <p class="core-lead">${escapeHtml(reading.summary)}</p>
    <p class="core-hero">${escapeHtml(reading.thesis)}</p>
    <p class="core-tail">${escapeHtml(reading.invitation)}</p>
  </div>`,
  )
  .replace(
    /const data = \[[\s\S]*?\n\];\n\nconst MARKS/,
    `const data = ${JSON.stringify(panelData, null, 2)};\n\nconst MARKS`,
  )
  .replace(
    /const STORAGE_KEY = '[^']*';/,
    `const STORAGE_KEY = ${JSON.stringify(`reading-trace-${reading.id}-marks-v1`)};`,
  );

if (output === template) {
  throw new Error("Template synchronization did not replace any content.");
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, output);

const itemCount = panelData.reduce((sum, group) => sum + group.items.length, 0);
console.log(
  `Synced polished experience: ${panelData.length} groups, ${itemCount} propositions.`,
);
