import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
  assert.match(html, /Where I Lived/);
  assert.match(html, /Reading Trace/);
  assert.match(html, /Project Gutenberg/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Starter Project/i);
});

test("keeps content separate from the visual renderer", async () => {
  const [page, data, types, acknowledgements] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/walden.ts", import.meta.url), "utf8"),
    readFile(new URL("../data/types.ts", import.meta.url), "utf8"),
    readFile(new URL("../ACKNOWLEDGEMENTS.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /from "\.\.\/data\/walden"/);
  assert.match(page, /localStorage/);
  assert.match(page, /exportTrace/);
  assert.match(data, /Project Gutenberg/);
  assert.match(types, /ReadingDocument/);
  assert.match(types, /"core" \| "support" \| "turn"/);
  assert.match(acknowledgements, /ljg-read/);
  assert.doesNotMatch(page, /ljg-card|wiki-token|飞书/);
});
