import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAddress, toolAnnotations, validateToolInput } from "../src/bridge.js";

test("normalizes demo, domain, URL, and search addresses", () => {
  assert.equal(normalizeAddress("demo://civic-desk"), "demo://civic-desk");
  assert.equal(normalizeAddress("example.com/path"), "https://example.com/path");
  assert.equal(normalizeAddress("https://openai.com"), "https://openai.com");
  assert.match(normalizeAddress("quiet hotels"), /^https:\/\/www\.google\.com\/search\?q=/);
});

test("validates required, typed, enum, and bounded fields", () => {
  const schema = { type: "object", properties: { kind: { type: "string", enum: ["a", "b"] }, count: { type: "integer", minimum: 1, maximum: 3 } }, required: ["kind", "count"] };
  assert.equal(validateToolInput(schema, { kind: "a", count: 2 }), null);
  assert.match(validateToolInput(schema, { kind: "a" }), /Missing required/);
  assert.match(validateToolInput(schema, { kind: "c", count: 2 }), /must be one of/);
  assert.match(validateToolInput(schema, { kind: "a", count: 8 }), /at most/);
  assert.match(validateToolInput(schema, { kind: "a", count: 2, extra: true }), /Unexpected/);
});

test("derives truthful WebMCP annotations from risk", () => {
  assert.deepEqual(toolAnnotations({ risk: "read" }), { readOnlyHint: true, untrustedContentHint: true });
  assert.deepEqual(toolAnnotations({ risk: "write" }), { readOnlyHint: false, untrustedContentHint: true });
});
