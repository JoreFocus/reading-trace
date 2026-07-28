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

const uiByLanguage = {
  "zh-CN": {
    titleSuffix: "阅迹",
    navigation: "导航",
    themeToggle: "切换深浅色模式",
    brand: "伴读",
    brandAction: "标注",
    companionReading: "Companion Reading",
    markShortcut: "标记",
    moveShortcut: "上下条",
    editNoteShortcut: "编辑当前备注",
    filterShortcut: "切换筛选（记位置）",
    nextUnmarkedShortcut: "下一个未标",
    cancelFocusShortcut: "取消焦点",
    eyebrow: "阅迹体验版 / 伴读标注",
    propositionUnit: "条命题",
    coreLabel: "/ 核心 /",
    all: "全部",
    unmarked: "未标",
    deep: "深刻",
    strong: "强烈",
    partial: "部分",
    hold: "保留",
    disagree: "不认",
    firstHintBefore: "点击右侧",
    firstHintAfter: "标记你与每条命题的共鸣",
    export: "导出结果",
    restore: "还原初始",
    clear: "清空",
    clickToCopyHint: "点击文本框即可复制：",
    closingSub: "已记下 · 可导出交给 AI",
    backToEdit: "返回修改",
    copyResult: "复制结果",
    keyboardShortcuts: "键盘快捷键",
    nextItem: "下一条",
    previousItem: "上一条",
    toggleNote: "打开 / 退出备注",
    exitEditing: "退出编辑",
    previousFilter: "上一筛选",
    nextFilter: "下一筛选（记位置）",
    saveAndNext: "保存并下一条",
    newLine: "换行",
    editNote: "点击编辑备注",
    partialPrompt: "哪一部分你不完全认同？（选填）",
    holdPrompt: "你暂时保留判断的原因是？（选填）",
    disagreePrompt: "你认为问题出在哪里？（选填）",
    defaultPrompt: "你想补充什么？（选填）",
    closingLines: ["今天到这里", "一遍 · 读完了", "都读完了"],
    copiedForAi: "已复制 · 粘贴给 AI 即可",
    copied: "已复制",
    clickToCopy: "点击复制",
    undo: "撤销",
    confirmClear: "清空所有标注和备注？",
    clearedUndo: "已清空 · 5秒内可撤销",
    confirmRestore: "还原到初始标注？（备注不清除）",
    restoredUndo: "已还原初始 · 5秒内可撤销",
    switchToLight: "切换到浅色模式",
    switchToDark: "切换到深色模式"
  },
  en: {
    titleSuffix: "Reading Trace",
    navigation: "Navigation",
    themeToggle: "Toggle light or dark mode",
    brand: "Reading",
    brandAction: "Trace",
    companionReading: "Companion Reading",
    markShortcut: "mark",
    moveShortcut: "move between items",
    editNoteShortcut: "edit the current note",
    filterShortcut: "switch filters (keeps position)",
    nextUnmarkedShortcut: "next unmarked item",
    cancelFocusShortcut: "clear focus",
    eyebrow: "Reading Trace / Companion Annotation",
    propositionUnit: "propositions",
    coreLabel: "/ Core /",
    all: "All",
    unmarked: "Unmarked",
    deep: "Deep",
    strong: "Strong",
    partial: "Partial",
    hold: "Hold",
    disagree: "Disagree",
    firstHintBefore: "Use",
    firstHintAfter: "to mark how each proposition meets you",
    export: "Export",
    restore: "Restore initial",
    clear: "Clear",
    clickToCopyHint: "Click the text box to copy:",
    closingSub: "Saved · ready to export to AI",
    backToEdit: "Keep editing",
    copyResult: "Copy result",
    keyboardShortcuts: "Keyboard shortcuts",
    nextItem: "next item",
    previousItem: "previous item",
    toggleNote: "open / close note",
    exitEditing: "exit editing",
    previousFilter: "previous filter",
    nextFilter: "next filter (keeps position)",
    saveAndNext: "save and continue",
    newLine: "new line",
    editNote: "Click to edit note",
    partialPrompt: "Which part do you not fully accept? (optional)",
    holdPrompt: "Why are you holding judgment for now? (optional)",
    disagreePrompt: "Where do you think the problem lies? (optional)",
    defaultPrompt: "What would you like to add? (optional)",
    closingLines: ["Enough for today", "One reading · complete", "All read"],
    copiedForAi: "Copied · ready to paste into AI",
    copied: "Copied",
    clickToCopy: "Click to copy",
    undo: "Undo",
    confirmClear: "Clear all marks and notes?",
    clearedUndo: "Cleared · undo available for 5 seconds",
    confirmRestore: "Restore the initial marks? (Notes will remain.)",
    restoredUndo: "Initial marks restored · undo available for 5 seconds",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode"
  }
};

const normalizedLanguage = reading.language.toLowerCase();
const languageFamily = normalizedLanguage.startsWith("zh") ? "zh-CN" : "en";
if (
  !normalizedLanguage.startsWith("zh") &&
  !normalizedLanguage.startsWith("en")
) {
  const missingUiKeys = Object.keys(uiByLanguage.en).filter(
    (key) => !Object.hasOwn(reading.ui ?? {}, key),
  );
  if (missingUiKeys.length) {
    throw new Error(
      `language ${reading.language} requires complete ui localization; missing: ${missingUiKeys.join(", ")}`,
    );
  }
}
const ui = {
  ...uiByLanguage[languageFamily],
  ...(reading.ui ?? {}),
};

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
  .replace(/<html lang="[^"]*">/, `<html lang="${escapeHtml(reading.language)}">`)
  .replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(reading.title)} · ${escapeHtml(ui.titleSuffix)}</title>`,
  )
  .replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeHtml(reading.summary)}">`,
  )
  .replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escapeHtml(reading.title)} · ${escapeHtml(ui.titleSuffix)}">`,
  )
  .replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${escapeHtml(reading.summary)}">`,
  )
  .replace(/content: "\/ 核心 \/";/, `content: ${JSON.stringify(ui.coreLabel)};`)
  .replace(
    /<button class="drawer-toggle"[\s\S]*?<\/button>/,
    `<button class="drawer-toggle" id="drawer-toggle" onclick="toggleDrawer()" aria-label="${escapeHtml(ui.navigation)}">
  <span></span><span></span><span></span>
</button>`,
  )
  .replace(
    /<button class="theme-toggle"[\s\S]*?<\/button>/,
    `<button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" aria-label="${escapeHtml(ui.themeToggle)}" title="${escapeHtml(ui.themeToggle)}">☾</button>`,
  )
  .replace(
    /<div class="drawer-brand">[\s\S]*?<div class="drawer-sub">[\s\S]*?<\/div>/,
    `<div class="drawer-brand">${escapeHtml(ui.brand)}<em>·</em>${escapeHtml(ui.brandAction)}</div>
  <div class="drawer-sub">${escapeHtml(ui.companionReading)}</div>`,
  )
  .replace(
    /<div class="drawer-foot">[\s\S]*?<\/div>/,
    `<div class="drawer-foot">
    <kbd>0</kbd>~<kbd>4</kbd> ${escapeHtml(ui.markShortcut)}<br>
    <kbd>↓</kbd> <kbd>↑</kbd> ${escapeHtml(ui.moveShortcut)}<br>
    <kbd>E</kbd> ${escapeHtml(ui.editNoteShortcut)}<br>
    <kbd>←</kbd> <kbd>→</kbd> ${escapeHtml(ui.filterShortcut)}<br>
    <kbd>n</kbd> ${escapeHtml(ui.nextUnmarkedShortcut)}<br>
    <kbd>esc</kbd> ${escapeHtml(ui.cancelFocusShortcut)}
  </div>`,
  )
  .replace(
    /<div class="head-eyebrow">[\s\S]*?<\/div>/,
    `<div class="head-eyebrow">${escapeHtml(ui.eyebrow)}</div>`,
  )
  .replace(
    /<h1 class="title">[\s\S]*?<\/h1>/,
    `<h1 class="title">${escapeHtml(reading.title)}</h1>`,
  )
  .replace(
    /<div class="head-meta">[\s\S]*?<\/div>/,
    `<div class="head-meta">
      <span>${escapeHtml(reading.source.label)}</span>
      <span id="meta-count">— ${escapeHtml(ui.propositionUnit)}</span>
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
    /<div class="filters">[\s\S]*?<\/div>/,
    `<div class="filters">
    <button class="filter-btn active" data-filter="all">${escapeHtml(ui.all)}</button>
    <button class="filter-btn" data-filter="unmarked">${escapeHtml(ui.unmarked)}</button>
    <button class="filter-btn" data-filter="💡">💡 ${escapeHtml(ui.deep)}</button>
    <button class="filter-btn" data-filter="✅">✅ ${escapeHtml(ui.strong)}</button>
    <button class="filter-btn" data-filter="🟡">🟡 ${escapeHtml(ui.partial)}</button>
    <button class="filter-btn" data-filter="⚪">⚪ ${escapeHtml(ui.hold)}</button>
    <button class="filter-btn" data-filter="❌">❌ ${escapeHtml(ui.disagree)}</button>
  </div>`,
  )
  .replace(
    /<p class="first-hint"[\s\S]*?<\/p>/,
    `<p class="first-hint" id="first-hint">${escapeHtml(ui.firstHintBefore)} <em>✅ 🟡 ⚪ ❌</em> ${escapeHtml(ui.firstHintAfter)}</p>`,
  )
  .replace(
    /<div class="footer-actions">[\s\S]*?<\/div>/,
    `<div class="footer-actions">
    <button class="btn" onclick="exportMarks()">${escapeHtml(ui.export)}</button>
    <button class="btn ghost" onclick="restoreOriginal()">${escapeHtml(ui.restore)}</button>
    <button class="btn ghost" onclick="resetMarks()">${escapeHtml(ui.clear)}</button>
  </div>`,
  )
  .replace(
    /<div class="export-area"[\s\S]*?<\/div>/,
    `<div class="export-area" id="export-area">
    <p>${escapeHtml(ui.clickToCopyHint)}</p>
    <textarea id="export-text" readonly></textarea>
  </div>`,
  )
  .replace(
    /<div class="closing-sub">[\s\S]*?<\/div>/,
    `<div class="closing-sub">${escapeHtml(ui.closingSub)}</div>`,
  )
  .replace(
    /<div class="closing-actions"[\s\S]*?<\/div>/,
    `<div class="closing-actions" id="closing-actions">
    <button class="closing-btn" id="closing-back" type="button">${escapeHtml(ui.backToEdit)}</button>
    <button class="closing-btn primary" id="closing-export" type="button">${escapeHtml(ui.copyResult)}</button>
  </div>`,
  )
  .replace(
    /<button class="kbd-toggle"[\s\S]*?<\/button>/,
    `<button class="kbd-toggle" onclick="toggleKbdHint()" title="${escapeHtml(ui.keyboardShortcuts)}">?</button>`,
  )
  .replace(
    /<div class="kbd-hint"[\s\S]*?<\/div>/,
    `<div class="kbd-hint" id="kbd-hint">
  <kbd>0</kbd> 💡 &nbsp;<kbd>1</kbd> ✅ &nbsp;<kbd>2</kbd> 🟡 &nbsp;<kbd>3</kbd> ⚪ &nbsp;<kbd>4</kbd> ❌<br>
  <kbd>↓</kbd> ${escapeHtml(ui.nextItem)} · <kbd>↑</kbd> ${escapeHtml(ui.previousItem)}<br>
  <kbd>E</kbd> ${escapeHtml(ui.toggleNote)} · <kbd>esc</kbd> ${escapeHtml(ui.exitEditing)}<br>
  <kbd>←</kbd> ${escapeHtml(ui.previousFilter)} · <kbd>→</kbd> ${escapeHtml(ui.nextFilter)}<br>
  <kbd>n</kbd> ${escapeHtml(ui.nextUnmarkedShortcut)} · <kbd>enter</kbd> ${escapeHtml(ui.saveAndNext)} · <kbd>shift+enter</kbd> ${escapeHtml(ui.newLine)}
</div>`,
  )
  .replace(
    /const data = \[[\s\S]*?\n\];\n\nconst MARKS/,
    `const UI = ${JSON.stringify(ui, null, 2)};\n\nconst data = ${JSON.stringify(panelData, null, 2)};\n\nconst MARKS`,
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
