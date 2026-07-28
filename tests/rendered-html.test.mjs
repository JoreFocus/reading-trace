import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Reading Trace document shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>阅迹 Reading Trace<\/title>/i);
  assert.match(html, /experience\.html/);
  assert.match(html, /阅迹伴读标注/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Starter Project/i);
});

test("generates the polished interaction from the content file", async () => {
  const [page, generator, experience, data, types, acknowledgements, agentGuide, skill] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../scripts/sync-experience.mjs", import.meta.url), "utf8"),
    readFile(new URL("../public/experience.html", import.meta.url), "utf8"),
    readFile(new URL("../data/reading.json", import.meta.url), "utf8"),
    readFile(new URL("../data/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../ACKNOWLEDGEMENTS.md", import.meta.url), "utf8"),
    readFile(new URL("../AGENTS.md", import.meta.url), "utf8"),
    readFile(
      new URL("../skills/build-reading-trace/SKILL.md", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(page, /src="\/experience\.html"/);
  assert.match(generator, /data\/reading\.json/);
  assert.match(generator, /templates\/reading-trace\.html/);
  assert.match(experience, /Where I Lived/);
  assert.match(experience, /Project Gutenberg/);
  assert.match(experience, /💡 深刻/);
  assert.match(experience, /closing-stage/);
  assert.match(experience, /reading-trace-theme/);
  assert.match(experience, /localStorage/);
  assert.match(experience, /exportMarks/);
  assert.match(data, /Project Gutenberg/);
  assert.match(types, /ReadingDocument/);
  assert.match(types, /"core" \| "support" \| "turn"/);
  assert.match(acknowledgements, /ljg-read/);
  assert.match(agentGuide, /原文.*系统判断.*读者判断/s);
  assert.match(skill, /name: build-reading-trace/);
  assert.doesNotMatch(experience, /ljg-card|wiki-token|飞书/);
});

test("keeps the polished renderer when the material is replaced", async () => {
  await execFileAsync(process.execPath, [
    new URL("../scripts/sync-experience.mjs", import.meta.url).pathname,
    "tests/fixtures/reading.custom.json",
    "public/experience.custom.html",
  ]);

  const experience = await readFile(
    new URL("../public/experience.custom.html", import.meta.url),
    "utf8",
  );

  assert.match(experience, /注意力如何塑造一天/);
  assert.match(experience, /自定义测试语料/);
  assert.match(experience, /分心不是一次明确决定/);
  assert.match(experience, /💡 深刻/);
  assert.match(experience, /closing-stage/);
  assert.match(experience, /reading-trace-custom-attention-v1-marks-v1/);
  assert.doesNotMatch(experience, /Where I Lived|Project Gutenberg/);
});
