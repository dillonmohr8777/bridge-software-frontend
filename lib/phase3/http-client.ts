import {
  Phase3Error,
  type AuthCredentials,
  type ConfirmContactsInput,
  type ConfirmContactsResult,
  type CreatePostInput,
  type Phase3Client,
  type Phase3ErrorCode,
  type ProfileProjection,
  type SessionClaims,
  type RegisterInput,
  type RegisterResult,
  type UpdateContactsInput,
  type UploadIntent,
  type PostRecord,
} from "./types.ts";

function mapStatus(status: number): Phase3ErrorCode {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 409) return "conflict";
  if (status === 422 || status === 400) return "validation";
  return "unavailable";
}

function userMessageFor(code: Phase3ErrorCode): string {
  switch (code) {
    case "unauthenticated":
      return "Sign in to continue.";
    case "forbidden":
      return "This account does not have permission for that action.";
    case "validation":
      return "Check the highlighted fields and try again.";
    case "conflict":
      return "That record changed. Refresh and try again.";
    default:
      return "The request could not be completed. Your work is still here — try again.";
  }
}

/**
 * D-10 (open decision) — session transport.
 *
 * Bridge is designed for cookie sessions: docs/INTEGRATION-PIPELINE.md forbids putting
 * access tokens in browser storage, and docs/INTEGRATION-API-CONTRACT.md documents
 * `credentials: "include"`. "cookie" is therefore the default and the only mode the app
 * ships in today.
 *
 * "bearer" exists as a narrow, clearly-marked seam so D-10 can be settled the other way
 * without rewriting call sites. Two rules hold in either mode:
 *   1. The token is held in memory on this client instance for the tab's lifetime only.
 *      It is never written to sessionStorage, localStorage, IndexedDB, or a cookie the
 *      page can read, and it is never logged.
 *   2. `credentials` is "include" for cookies and "omit" for bearer, because a
 *      credentialed request fails outright unless the API returns
 *      `Access-Control-Allow-Credentials: true` (absent on the Greencubes origin as of
 *      2026-09-02).
 *
 * Switching to bearer is a contract change and must be flagged before it lands, per
 * docs/INTEGRATION-API-CONTRACT.md.
 */
export type AuthTransport = "cookie" | "bearer";

export class HttpPhase3Client implements Phase3Client {
  private readonly baseUrl: string;
  private readonly transport: AuthTransport;
  /** In-memory only. Never persisted. See the D-10 note above. */
  private bearerToken: string | null = null;

  constructor(baseUrl: string, transport: AuthTransport = "cookie") {
    this.baseUrl = baseUrl;
    this.transport = transport;
  }

  /** Bearer seam. No-op under the default cookie transport. */
  setBearerToken(token: string | null) {
    if (this.transport !== "bearer") return;
    this.bearerToken = token;
  }

  private endpoint(path: string): string {
    return `${this.baseUrl.replace(/\/$/, "")}${path}`;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.endpoint(path), {
        ...init,
        credentials: this.transport === "cookie" ? "include" : "omit",
        headers: {
          Accept: "application/json",
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...(this.bearerToken ? { Authorization: `Bearer ${this.bearerToken}` } : {}),
          ...init?.headers,
        },
      });
    } catch (cause) {
      throw new Phase3Error("unavailable", userMessageFor("unavailable"), cause);
    }

    if (!response.ok) {
      const code = mapStatus(response.status);
      throw new Phase3Error(code, userMessageFor(code));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    try {
      return (await response.json()) as T;
    } catch (cause) {
      throw new Phase3Error("unavailable", userMessageFor("unavailable"), cause);
    }
  }

  register(input: RegisterInput) {
    return this.request<RegisterResult>(this.endpointPath.register, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  login(input: AuthCredentials) {
    return this.request<SessionClaims>(this.endpointPath.login, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async logout() {
    await this.request<void>(this.endpointPath.logout, { method: "POST" });
    this.bearerToken = null;
  }

  getSession() {
    return this.request<SessionClaims>(this.endpointPath.session);
  }

  createUploadIntent(file: File) {
    return this.request<UploadIntent>(this.endpointPath.uploads, {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }),
    });
  }

  createPost(input: CreatePostInput) {
    return this.request<PostRecord>(this.endpointPath.posts, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  listPosts() {
    return this.request<PostRecord[]>(this.endpointPath.posts);
  }

  getProfileProjection(view: "public" | "protected") {
    return this.request<ProfileProjection>(`${this.endpointPath.profile}?view=${view}`);
  }

  confirmContacts(input: ConfirmContactsInput) {
    return this.request<ConfirmContactsResult>(this.endpointPath.confirmContacts, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateContacts(input: UpdateContactsInput) {
    return this.request<ProfileProjection>(this.endpointPath.contacts, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  private readonly endpointPath = {
    // Contracted paths from docs/INTEGRATION-API-CONTRACT.md. The Greencubes staging
    // origin currently serves session claims at /api/v1/auth/me instead of
    // /api/v1/session; that mismatch is Miraj's to reconcile, not ours to guess at.
    register: "/api/v1/auth/register",
    login: "/api/v1/auth/login",
    logout: "/api/v1/auth/logout",
    session: "/api/v1/session",
    uploads: "/api/v1/uploads/intent",
    posts: "/api/v1/posts",
    profile: "/api/v1/profiles/current",
    confirmContacts: "/api/v1/contacts/confirm",
    contacts: "/api/v1/contacts",
  } as const;
}
