import test from "node:test";
import assert from "node:assert/strict";
import { EngagementClient, parsePost, validatePost } from "./engagement.ts";
const id = "f286c113-2331-499d-a1cf-eabc44662738";
const post = { id, profileId: id, type: "news", title: "News", body: "Details", status: "draft", createdAt: "2026-09-12T00:00:00Z", updatedAt: "2026-09-12T00:00:00Z" };
test("post schema rejects malformed authority and validates bounded copy", () => {
  assert.deepEqual(parsePost(post), post);
  assert.throws(() => parsePost({ ...post, status: "approved" }));
  assert.throws(() => parsePost({ ...post, profileId: "fake" }));
  assert.throws(() => validatePost({ type: "news", title: " ", body: "ok", status: "draft" }));
  assert.throws(() => validatePost({ type: "news", title: "ok", body: "a".repeat(10001), status: "draft" }));
});
test("engagement writes use correct prefix, cookies, immutable publisher and server read receipt", async () => {
  const original = globalThis.fetch; const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (url, init) => { calls.push({ url: String(url), init }); return Response.json({ post }); };
  try {
    const client = new EngagementClient("https://bridge.test");
    await client.savePost(id, id, { type: "news", title: "Test", body: "Details", status: "draft" });
    assert.equal(calls[0].url, `https://bridge.test/api/v1/engagement/posts/${id}`);
    assert.equal(calls[0].init?.credentials, "include"); assert.equal(calls[0].init?.method, "PATCH");
    assert.equal("profileId" in JSON.parse(String(calls[0].init?.body)), false);
    globalThis.fetch = async () => Response.json({ saved: false });
    await assert.rejects(client.setSaved(id, true), { code: "unavailable" });
    globalThis.fetch = async () => new Response(null, { status: 403 });
    await assert.rejects(client.posts(), { code: "forbidden" });
  } finally { globalThis.fetch = original; }
});
test("saved status reads authenticated endpoint and rejects ambiguous receipts", async () => {
  const original = globalThis.fetch; const client = new EngagementClient("https://bridge.test");
  try {
    globalThis.fetch = async (url, init) => { assert.equal(String(url), `https://bridge.test/api/v1/engagement/saved-profiles/${id}`); assert.equal(init?.credentials, "include"); return Response.json({ saved: true }); };
    assert.equal(await client.isSaved(id), true);
    globalThis.fetch = async () => Response.json({ saved: false });
    assert.equal(await client.isSaved(id), false);
    globalThis.fetch = async () => Response.json({ saved: "false" });
    await assert.rejects(client.isSaved(id), { code: "unavailable" });
    await assert.rejects(client.isSaved("bad-id"));
  } finally { globalThis.fetch = original; }
});
