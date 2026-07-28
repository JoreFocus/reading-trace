import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const reading = JSON.parse(
  await readFile(new URL("../data/reading.json", import.meta.url), "utf8"),
);
const roles = new Set(["core", "support", "turn"]);

function nonEmpty(value, path) {
  assert.equal(typeof value, "string", `${path} must be a string`);
  assert.ok(value.trim(), `${path} must not be empty`);
}

for (const field of ["id", "language", "title", "summary", "thesis", "invitation"]) {
  nonEmpty(reading[field], field);
}

assert.ok(reading.source && typeof reading.source === "object", "source is required");
nonEmpty(reading.source.label, "source.label");
nonEmpty(reading.source.licenseNote, "source.licenseNote");
assert.equal(typeof reading.source.url, "string", "source.url must be a string");

for (const role of roles) {
  nonEmpty(reading.roleLabels?.[role], `roleLabels.${role}`);
}

assert.ok(Array.isArray(reading.groups) && reading.groups.length, "groups must not be empty");

const groupIds = new Set();
const itemIds = new Set();

for (const [groupIndex, group] of reading.groups.entries()) {
  const groupPath = `groups[${groupIndex}]`;
  for (const field of ["id", "index", "kicker", "shortTitle", "title", "description"]) {
    nonEmpty(group[field], `${groupPath}.${field}`);
  }
  assert.ok(!groupIds.has(group.id), `duplicate group id: ${group.id}`);
  groupIds.add(group.id);
  assert.ok(Array.isArray(group.items) && group.items.length, `${groupPath}.items must not be empty`);

  for (const [itemIndex, item] of group.items.entries()) {
    const itemPath = `${groupPath}.items[${itemIndex}]`;
    for (const field of ["id", "quote", "context", "prompt"]) {
      nonEmpty(item[field], `${itemPath}.${field}`);
    }
    assert.ok(roles.has(item.role), `${itemPath}.role is invalid`);
    assert.ok(!itemIds.has(item.id), `duplicate item id: ${item.id}`);
    itemIds.add(item.id);
  }
}

console.log(
  `Reading Trace content valid: ${reading.groups.length} groups, ${itemIds.size} reading positions.`,
);
