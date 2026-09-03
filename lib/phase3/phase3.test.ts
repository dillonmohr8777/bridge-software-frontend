import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  canCreatePromotion,
  canPublishPost,
  canViewProtectedProfile,
  resolveEffectiveAudiences,
  validateContacts,
  validateUploadFile,
  visiblePostsForView,
} from "./audiences.ts";
import { getPhase3Client, isPhase3LiveApi } from "./client.ts";
import { HttpPhase3Client } from "./http-client.ts";
import { MockPhase3Client, mockHarborClaims } from "./mock-client.ts";
import { Phase3Error, type PostRecord } from "./types.ts";

test("protected detail removes Adults 21+ from the effective audience set", () => {
  assert.deepEqual(
    resolveEffectiveAudiences(["adults", "retailers", "adults"], true),
    ["retailers"],
  );
});

test("publish is blocked when no eligible audience remains", () => {
  assert.equal(canPublishPost(["adults"], true, null), false);
  assert.equal(canPublishPost(["retailers"], true, null), true);
  assert.equal(canPublishPost(["retailers"], false, "File exceeds 25 MB."), false);
});

test("upload validation accepts only the contracted file types and size", () => {
  const png = new File(["ok"], "promo.png", { type: "image/png" });
  assert.equal(validateUploadFile(png), null);

  const gif = new File(["no"], "promo.gif", { type: "image/gif" });
  assert.match(validateUploadFile(gif) ?? "", /Unsupported type/);

  const huge = new File(["ok"], "promo.png", { type: "image/png" });
  Object.defineProperty(huge, "size", { value: 25 * 1024 * 1024 + 1 });
  assert.match(validateUploadFile(huge) ?? "", /25 MB/);
});

test("verified dispensary with create_promotion can publish; unverified cannot", () => {
  assert.equal(canCreatePromotion(mockHarborClaims), true);
  assert.equal(
    canCreatePromotion({ ...mockHarborClaims, organizationVerificationState: "pending" }),
    false,
  );
  assert.equal(
    canViewProtectedProfile({ ...mockHarborClaims, delegatedPermissions: ["create_promotion"] }),
    false,
  );
});

test("mock promotion slice records an upload and a protected post", async () => {
  const client = new MockPhase3Client();
  const file = new File(["asset"], "menu.png", { type: "image/png" });
  const upload = await client.createUploadIntent(file);
  const post = await client.createPost({
    contentType: "Promotion",
    message: "Autumn flower special for verified retailers",
    uploadId: upload.uploadId,
    audienceIds: ["retailers"],
    protectedDetail: true,
  });
  assert.equal(post.moderationState, "published");
  assert.deepEqual(post.audienceIds, ["retailers"]);
  assert.equal(post.protectedDetail, true);
  const listed = await client.listPosts();
  assert.equal(listed.length, 1);
  assert.equal(listed[0]?.postId, post.postId);
});

test("mock promotion slice rejects protected detail aimed at Adults 21+", async () => {
  const client = new MockPhase3Client();
  await assert.rejects(
    () => client.createPost({
      contentType: "Promotion",
      message: "Public wholesale price list",
      uploadId: null,
      audienceIds: ["adults"],
      protectedDetail: true,
    }),
    (error: unknown) => error instanceof Phase3Error && error.code === "validation",
  );
});

test("mock promotion slice rejects an empty message", async () => {
  const client = new MockPhase3Client();
  await assert.rejects(
    () => client.createPost({
      contentType: "Promotion",
      message: "   ",
      uploadId: null,
      audienceIds: ["retailers"],
      protectedDetail: false,
    }),
    (error: unknown) => error instanceof Phase3Error && error.code === "validation",
  );
});

test("promotion permission cannot publish Update or Event content", async () => {
  const client = new MockPhase3Client();
  for (const contentType of ["Update", "Event"] as const) {
    await assert.rejects(
      () => client.createPost({
        contentType,
        message: `${contentType} cannot use the Promotion-only Phase 3 slice`,
        uploadId: null,
        audienceIds: ["retailers"],
        protectedDetail: false,
      }),
      (error: unknown) => error instanceof Phase3Error && error.code === "validation",
    );
  }
});

test("unverified organization cannot upload or publish", async () => {
  const client = new MockPhase3Client({
    claims: { ...mockHarborClaims, organizationVerificationState: "unverified" },
  });
  const file = new File(["asset"], "menu.png", { type: "image/png" });
  await assert.rejects(
    () => client.createUploadIntent(file),
    (error: unknown) => error instanceof Phase3Error && error.code === "forbidden",
  );
  await assert.rejects(
    () => client.createPost({
      contentType: "Promotion",
      message: "Should not publish",
      uploadId: null,
      audienceIds: ["retailers"],
      protectedDetail: false,
    }),
    (error: unknown) => error instanceof Phase3Error && error.code === "forbidden",
  );
});

test("protected profile projection hides contacts in public view and records confirmation", async () => {
  const now = new Date("2026-08-19T17:00:00.000Z");
  const client = new MockPhase3Client({ now: () => now });
  const publicView = await client.getProfileProjection("public");
  const protectedView = await client.getProfileProjection("protected");
  assert.equal(publicView.contacts.length, 0);
  assert.equal(protectedView.contacts.length, 2);
  assert.equal(protectedView.confirmation.status, "needed");

  const confirmation = await client.confirmContacts({ organizationId: "org-harbor" });
  assert.equal(confirmation.actorUserId, "user-harbor-owner");
  assert.equal(confirmation.nextDue, "2026-09-18T17:00:00.000Z");

  const after = await client.getProfileProjection("protected");
  assert.equal(after.confirmation.status, "confirmed");
  assert.equal(after.confirmation.confirmedAt, confirmation.confirmedAt);
});

test("contact updates persist in B2B view and stay hidden in public view", async () => {
  const client = new MockPhase3Client();
  const updated = await client.updateContacts({
    organizationId: "org-harbor",
    contacts: [
      {
        kind: "sales",
        name: "Avery Chen",
        email: "avery.chen@example-harbor.invalid",
        phone: "(410) 555-0101",
      },
      {
        kind: "accounting",
        name: "Riley Patel",
        email: "riley.patel@example-harbor.invalid",
        phone: "(410) 555-0102",
      },
    ],
  });
  assert.equal(updated.contacts[0]?.name, "Avery Chen");
  const publicView = await client.getProfileProjection("public");
  assert.equal(publicView.contacts.length, 0);
  const protectedView = await client.getProfileProjection("protected");
  assert.equal(protectedView.contacts[1]?.name, "Riley Patel");
});

test("contact updates require both sales and accounting details", () => {
  assert.match(
    validateContacts([{ kind: "sales", name: "Only Sales", email: "a@b.c", phone: "1" }]) ?? "",
    /sales contact and one accounting/,
  );
});

test("public projection hides protected promotions while B2B keeps them", () => {
  const posts: PostRecord[] = [
    {
      postId: "post-1",
      contentType: "Promotion",
      message: "Retailer wholesale",
      uploadId: null,
      audienceIds: ["retailers"],
      protectedDetail: true,
      moderationState: "published",
      createdAt: "2026-08-19T17:00:00.000Z",
    },
    {
      postId: "post-2",
      contentType: "Promotion",
      message: "Public special",
      uploadId: null,
      audienceIds: ["adults"],
      protectedDetail: false,
      moderationState: "published",
      createdAt: "2026-08-19T17:00:00.000Z",
    },
  ];
  assert.deepEqual(visiblePostsForView(posts, "protected").map((post) => post.postId), ["post-1", "post-2"]);
  assert.deepEqual(visiblePostsForView(posts, "public").map((post) => post.postId), ["post-2"]);
});

test("mock client maps a forced failure to a retryable unavailable error", async () => {
  const client = new MockPhase3Client({ failNext: true });
  await assert.rejects(
    () => client.getSession(),
    (error: unknown) => error instanceof Phase3Error && error.code === "unavailable",
  );
  const session = await client.getSession();
  assert.equal(session.userId, "user-harbor-owner");
});

async function withMockFetch(
  impl: typeof fetch,
  run: () => Promise<void>,
) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
}

test("http client maps 401, 403, 422, and network failure to typed errors", async () => {
  const client = new HttpPhase3Client("https://api.example.invalid");

  await withMockFetch(async () => new Response("no", { status: 401 }), async () => {
    await assert.rejects(
      () => client.getSession(),
      (error: unknown) => error instanceof Phase3Error && error.code === "unauthenticated",
    );
  });

  await withMockFetch(async () => new Response("no", { status: 403 }), async () => {
    await assert.rejects(
      () => client.createPost({
        contentType: "Promotion",
        message: "Blocked",
        uploadId: null,
        audienceIds: ["retailers"],
        protectedDetail: false,
      }),
      (error: unknown) => error instanceof Phase3Error && error.code === "forbidden",
    );
  });

  await withMockFetch(async () => new Response("no", { status: 422 }), async () => {
    await assert.rejects(
      () => client.updateContacts({ organizationId: "org-harbor", contacts: [] }),
      (error: unknown) => error instanceof Phase3Error && error.code === "validation",
    );
  });

  await withMockFetch(async () => {
    throw new TypeError("Failed to fetch");
  }, async () => {
    await assert.rejects(
      () => client.listPosts(),
      (error: unknown) => error instanceof Phase3Error && error.code === "unavailable",
    );
  });
});

test("http client returns JSON from a successful session read", async () => {
  await withMockFetch(async () => new Response(JSON.stringify(mockHarborClaims), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }), async () => {
    const client = new HttpPhase3Client("https://api.example.invalid");
    const session = await client.getSession();
    assert.equal(session.userId, "user-harbor-owner");
  });
});

test("http client sends credentialed requests to the versioned API origin", async () => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;

  await withMockFetch(async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(JSON.stringify(mockHarborClaims), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }, async () => {
    const client = new HttpPhase3Client("https://api.example.invalid/");
    await client.getSession();
  });

  assert.equal(requestUrl, "https://api.example.invalid/api/v1/session");
  assert.equal(requestInit?.credentials, "include");
});

test("http client maps malformed success JSON to a retryable unavailable error", async () => {
  await withMockFetch(async () => new Response("not-json", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }), async () => {
    const client = new HttpPhase3Client("https://api.example.invalid");
    await assert.rejects(
      () => client.getSession(),
      (error: unknown) => error instanceof Phase3Error && error.code === "unavailable",
    );
  });
});

// --- One client path -------------------------------------------------------
// These guard the rule that auth goes through the same Phase 3 client as every other
// call: same base URL, same status mapping, same Phase3Error, same mock-mode fallback.

test("auth calls go through the same client, base URL and status mapping", async () => {
  const seen: { url: string; method?: string; credentials?: RequestCredentials }[] = [];

  await withMockFetch(async (input, init) => {
    seen.push({ url: String(input), method: init?.method, credentials: init?.credentials });
    if (String(input).endsWith("/auth/register")) {
      return new Response(JSON.stringify({ emailVerificationRequired: true, message: "Check your email." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(mockHarborClaims), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }, async () => {
    const client = new HttpPhase3Client("https://api.example.invalid");
    const registered = await client.register({
      displayName: "Harbor",
      email: "owner@example.invalid",
      password: "correct-horse",
      role: "Dispensary",
    });
    assert.equal(registered.emailVerificationRequired, true);
    const session = await client.login({ email: "owner@example.invalid", password: "correct-horse" });
    assert.equal(session.userId, "user-harbor-owner");
    await client.logout();
  });

  assert.deepEqual(seen.map((call) => call.url), [
    "https://api.example.invalid/api/v1/auth/register",
    "https://api.example.invalid/api/v1/auth/login",
    "https://api.example.invalid/api/v1/auth/logout",
  ]);
  assert.deepEqual(seen.map((call) => call.method), ["POST", "POST", "POST"]);
  // Cookie sessions are the default transport, so auth stays credentialed like the rest.
  assert.deepEqual(seen.map((call) => call.credentials), ["include", "include", "include"]);
});

test("auth failures use the shared Phase3Error mapping, not a second error model", async () => {
  const client = new HttpPhase3Client("https://api.example.invalid");

  await withMockFetch(async () => new Response("no", { status: 401 }), async () => {
    await assert.rejects(
      () => client.login({ email: "owner@example.invalid", password: "wrong" }),
      (error: unknown) => error instanceof Phase3Error && error.code === "unauthenticated",
    );
  });

  await withMockFetch(async () => new Response("no", { status: 409 }), async () => {
    await assert.rejects(
      () => client.register({ displayName: "Harbor", email: "taken@example.invalid", password: "correct-horse", role: null }),
      (error: unknown) => error instanceof Phase3Error && error.code === "conflict",
    );
  });

  await withMockFetch(async () => {
    throw new TypeError("Failed to fetch");
  }, async () => {
    await assert.rejects(
      () => client.login({ email: "owner@example.invalid", password: "correct-horse" }),
      (error: unknown) => error instanceof Phase3Error && error.code === "unavailable",
    );
  });
});

test("the bearer seam omits credentials and never persists a token", async () => {
  let credentials: RequestCredentials | undefined;
  let authorization: string | undefined;

  await withMockFetch(async (input, init) => {
    credentials = init?.credentials;
    authorization = new Headers(init?.headers).get("Authorization") ?? undefined;
    return new Response(JSON.stringify(mockHarborClaims), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }, async () => {
    const client = new HttpPhase3Client("https://api.example.invalid", "bearer");
    client.setBearerToken("token-value");
    await client.getSession();
  });

  // A credentialed request fails outright without Access-Control-Allow-Credentials, which
  // the Greencubes origin does not send. Bearer mode must not ask for cookies.
  assert.equal(credentials, "omit");
  assert.equal(authorization, "Bearer token-value");
});

test("the bearer seam is inert under the default cookie transport", async () => {
  let authorization: string | null = "unset";

  await withMockFetch(async (input, init) => {
    authorization = new Headers(init?.headers).get("Authorization");
    return new Response(JSON.stringify(mockHarborClaims), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }, async () => {
    const client = new HttpPhase3Client("https://api.example.invalid");
    client.setBearerToken("token-value");
    await client.getSession();
  });

  assert.equal(authorization, null);
});

test("no client path writes a token to browser storage", () => {
  // docs/INTEGRATION-PIPELINE.md forbids access tokens in browser storage. Comments are
  // stripped first so the prohibition can still be explained in prose next to the code.
  const withoutComments = ["./client.ts", "./http-client.ts", "./mock-client.ts"]
    .map((file) => readFileSync(new URL(file, import.meta.url), "utf8"))
    .join(String.fromCharCode(10))
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  assert.doesNotMatch(withoutComments, /sessionStorage|localStorage|indexedDB/i);
});

test("mock mode carries the whole auth flow with no backend configured", async () => {
  const client = new MockPhase3Client();

  const registered = await client.register({
    displayName: "Harbor Dispensary",
    email: "owner@example.invalid",
    password: "correct-horse",
    role: "Dispensary",
  });
  assert.equal(registered.emailVerificationRequired, true);

  const member = await client.login({ email: "owner@example.invalid", password: "correct-horse" });
  assert.equal(member.adminScope, false);
  assert.equal(member.role, "dispensary");

  const admin = await client.login({ email: "admin@example.invalid", password: "correct-horse" });
  assert.equal(admin.adminScope, true);
  assert.equal(admin.role, "admin");

  await client.logout();
  await assert.rejects(
    () => client.getSession(),
    (error: unknown) => error instanceof Phase3Error && error.code === "unauthenticated",
  );

  // Signing back in restores a usable session rather than leaving the app stuck.
  const again = await client.login({ email: "owner@example.invalid", password: "correct-horse" });
  assert.equal(again.userId, mockHarborClaims.userId);
});

test("mock registration and sign-in reject invalid input with typed errors", async () => {
  const client = new MockPhase3Client();

  await assert.rejects(
    () => client.register({ displayName: "  ", email: "owner@example.invalid", password: "correct-horse", role: null }),
    (error: unknown) => error instanceof Phase3Error && error.code === "validation",
  );
  await assert.rejects(
    () => client.register({ displayName: "Harbor", email: "not-an-email", password: "correct-horse", role: null }),
    (error: unknown) => error instanceof Phase3Error && error.code === "validation",
  );
  await assert.rejects(
    () => client.register({ displayName: "Harbor", email: "owner@example.invalid", password: "short", role: null }),
    (error: unknown) => error instanceof Phase3Error && error.code === "validation",
  );
  await assert.rejects(
    () => client.login({ email: "owner@example.invalid", password: "short" }),
    (error: unknown) => error instanceof Phase3Error && error.code === "unauthenticated",
  );
});

test("getPhase3Client falls back to the in-memory adapter when no API base is set", () => {
  const previous = process.env.NEXT_PUBLIC_BRIDGE_API_BASE;
  try {
    delete process.env.NEXT_PUBLIC_BRIDGE_API_BASE;
    assert.equal(isPhase3LiveApi(), false);
    assert.ok(getPhase3Client() instanceof MockPhase3Client);

    process.env.NEXT_PUBLIC_BRIDGE_API_BASE = "https://api.example.invalid";
    assert.equal(isPhase3LiveApi(), true);
    assert.ok(getPhase3Client() instanceof HttpPhase3Client);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_BRIDGE_API_BASE;
    else process.env.NEXT_PUBLIC_BRIDGE_API_BASE = previous;
  }
});
