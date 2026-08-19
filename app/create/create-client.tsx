"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phase3Error,
  audienceCatalog,
  audienceLabel,
  applySimulatedFailure,
  applyUnverifiedOrganization,
  canCreatePromotion,
  canPublishPost,
  contentTypes,
  getPhase3Client,
  isPhase3LiveApi,
  resolveEffectiveAudiences,
  validateUploadFile,
  visiblePostsForView,
  type ContentType,
  type PostRecord,
  type SessionClaims,
  type UploadIntent,
} from "@/lib/phase3";

type PublishStatus = "idle" | "pending" | "success" | "error";
type SessionStatus = "loading" | "ready" | "error";
type UploadStatus = "idle" | "pending" | "accepted" | "error";

export function CreateClient() {
  const client = useMemo(() => getPhase3Client(), []);
  const [claims, setClaims] = useState<SessionClaims | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("loading");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>("Promotion");
  const [message, setMessage] = useState("");
  const [protectedDetail, setProtectedDetail] = useState(false);
  const [selected, setSelected] = useState<string[]>(["retailers"]);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadIntent | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [status, setStatus] = useState<PublishStatus>("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [unverifiedOrg, setUnverifiedOrg] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostRecord[]>([]);

  const effectiveAudiences = useMemo(
    () => resolveEffectiveAudiences(selected, protectedDetail),
    [protectedDetail, selected],
  );
  const eligible = claims ? canCreatePromotion(claims) : false;
  const hasMessage = message.trim().length > 0;
  const uploadReady = file === null || (uploadStatus === "accepted" && upload !== null);
  const canPublish = eligible
    && canPublishPost(selected, protectedDetail, fileError)
    && hasMessage
    && uploadReady
    && uploadStatus !== "pending"
    && status !== "success"
    && status !== "pending";

  useEffect(() => {
    let cancelled = false;
    Promise.all([client.getSession(), client.listPosts()])
      .then(([session, listed]) => {
        if (cancelled) return;
        setClaims(session);
        setPosts(listed);
        setSessionStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSessionStatus("error");
        setSessionError(error instanceof Phase3Error ? error.userMessage : "The session could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  async function onFile(next: File | null) {
    setFileError(null);
    setFileMeta(null);
    setFile(null);
    setUpload(null);
    setUploadStatus("idle");
    if (!next) return;
    const problem = validateUploadFile(next);
    if (problem) {
      setFileError(problem);
      return;
    }
    setFile(next);
    setFileMeta({ name: next.name, size: next.size });
    setUploadStatus("pending");
    try {
      applySimulatedFailure(client, simulateFailure);
      const intent = await client.createUploadIntent(next);
      setUpload(intent);
      setUploadStatus("accepted");
    } catch (error: unknown) {
      setUploadStatus("error");
      setFileError(error instanceof Phase3Error ? error.userMessage : "The upload could not be accepted.");
    }
  }

  function toggleAudience(id: string) {
    if (protectedDetail && id === "adults") return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  function resetComposer() {
    setContentType("Promotion");
    setMessage("");
    setProtectedDetail(false);
    setSelected(["retailers"]);
    setFileMeta(null);
    setFile(null);
    setFileError(null);
    setUpload(null);
    setUploadStatus("idle");
    setStatus("idle");
    setPublishError(null);
    setPublishedId(null);
  }

  async function reloadSession() {
    setSessionStatus("loading");
    setSessionError(null);
    try {
      const [session, listed] = await Promise.all([client.getSession(), client.listPosts()]);
      setClaims(session);
      setPosts(listed);
      setSessionStatus("ready");
    } catch (error: unknown) {
      setSessionStatus("error");
      setSessionError(error instanceof Phase3Error ? error.userMessage : "The session could not be loaded.");
    }
  }

  async function publish() {
    if (!canPublish) return;
    setStatus("pending");
    setPublishError(null);
    try {
      applySimulatedFailure(client, simulateFailure);
      const post = await client.createPost({
        contentType,
        message,
        uploadId: upload?.uploadId ?? null,
        audienceIds: effectiveAudiences,
        protectedDetail,
      });
      setPublishedId(post.postId);
      setPosts(await client.listPosts());
      setStatus("success");
    } catch (error: unknown) {
      setStatus("error");
      setPublishError(error instanceof Phase3Error ? error.userMessage : "The promotion could not be published.");
    }
  }

  const visiblePosts = visiblePostsForView(posts, "protected");

  if (sessionStatus === "loading") {
    return <p className="form-hint" aria-busy="true">Loading creator session…</p>;
  }

  if (sessionStatus === "error") {
    return <p className="form-error" role="alert">{sessionError}</p>;
  }

  return (
    <div className="create-layout">
      <form className="content-card create-form" onSubmit={(event) => { event.preventDefault(); void publish(); }}>
        {!eligible && (
          <p className="form-error" role="alert">
            This account cannot create promotions until membership is active and the organization is verified.
          </p>
        )}
        {status === "success" && (
          <p className="status-chip verified" role="status">
            Promotion accepted{publishedId ? ` · ${publishedId}` : ""}. Access is limited to {effectiveAudiences.map(audienceLabel).join(", ")}.
          </p>
        )}
        <label htmlFor="content-type">Content type</label>
        <select
          disabled={!eligible || status === "pending" || status === "success"}
          id="content-type"
          value={contentType}
          onChange={(event) => setContentType(event.target.value as ContentType)}
        >
          {contentTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
        <label htmlFor="message">Message</label>
        <textarea
          disabled={!eligible || status === "pending" || status === "success"}
          id="message"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Describe the offer or update"
        />
        <label htmlFor="asset">Asset upload</label>
        <input
          disabled={!eligible || status === "pending" || status === "success"}
          id="asset"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
          onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
        />
        {fileMeta && <p className="form-hint">Selected: <strong>{fileMeta.name}</strong> ({Math.round(fileMeta.size / 1024)} KB)</p>}
        {uploadStatus === "pending" && <p className="form-hint" aria-busy="true">Requesting upload intent…</p>}
        {upload && <p className="form-hint">Upload intent accepted: {upload.uploadId}</p>}
        {fileError && <p className="form-error" role="alert">{fileError}</p>}
        <fieldset className="audience-fieldset">
          <legend>Audiences</legend>
          {audienceCatalog.map((audience) => {
            const disabled = !eligible || status === "pending" || status === "success" || (protectedDetail && audience.id === "adults");
            const checked = effectiveAudiences.includes(audience.id);
            return (
              <label key={audience.id} className="check-row">
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleAudience(audience.id)} />
                <span>{audience.label}{protectedDetail && audience.id === "adults" ? " (removed while protected detail is on)" : ""}</span>
              </label>
            );
          })}
        </fieldset>
        <label className="check-row">
          <input
            type="checkbox"
            checked={protectedDetail}
            disabled={!eligible || status === "pending" || status === "success"}
            onChange={(event) => {
              setProtectedDetail(event.target.checked);
              if (event.target.checked) setSelected((prev) => prev.filter((id) => id !== "adults"));
            }}
          />
          <span>Include protected wholesale / business-only detail</span>
        </label>
        {protectedDetail && <p className="form-hint">Protected detail limits this post to verified audiences. Adults 21+ is disabled.</p>}
        {publishError && <p className="form-error" role="alert">{publishError}</p>}
        {status === "success" ? (
          <button className="button secondary full" type="button" onClick={resetComposer}>Create another promotion</button>
        ) : (
          <button className="button primary full" type="submit" disabled={!canPublish}>
            {status === "pending" ? "Publishing…" : canPublish ? "Publish promotion" : "Publish unavailable"}
          </button>
        )}
        {!canPublish && status !== "success" && (
          <p className="form-hint">Publish requires an eligible creator, a message, at least one eligible audience, and a finished upload when a file is attached.</p>
        )}
        {!isPhase3LiveApi() && (
          <details className="demo-controls">
            <summary>Phase 3 adapter controls</summary>
            <label className="check-row">
              <input checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} type="checkbox" />
              Simulate a network failure
            </label>
            <label className="check-row">
              <input
                checked={unverifiedOrg}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setUnverifiedOrg(enabled);
                  applyUnverifiedOrganization(client, enabled);
                  void reloadSession();
                }}
                type="checkbox"
              />
              Use an unverified organization
            </label>
            <p className="form-hint">Using the in-memory adapter. Server authorization is still required in production.</p>
          </details>
        )}
      </form>
      <aside className="content-card create-preview" aria-live="polite">
        <p className="eyebrow">Preview</p>
        <h3>{contentType}</h3>
        <p>{message || "Message preview appears here."}</p>
        {fileMeta && <p className="muted">Asset: {fileMeta.name}</p>}
        <p className="muted">Access level: {protectedDetail ? "Verified audiences only" : "As selected"}</p>
        <div className="tag-row">
          {effectiveAudiences.length === 0
            ? <span className="tag">No eligible audience</span>
            : effectiveAudiences.map((id) => <span className="tag" key={id}>{audienceLabel(id)}</span>)}
        </div>
        <p className="form-hint">
          {isPhase3LiveApi() ? "Publishing through the live /api/v1 contract." : "Phase 3 mock adapter. Server authorization is required in production."}
        </p>
      </aside>
      <section className="content-card published-feed" aria-live="polite">
        <p className="eyebrow">Persisted promotions</p>
        <h3>Multi-audience records stay on this organization</h3>
        {visiblePosts.length === 0 ? (
          <p className="muted">No promotions recorded yet. Publish one to see audience persistence here and on My Profile.</p>
        ) : (
          visiblePosts.map((post) => (
            <article className="published-item" key={post.postId}>
              <h4>{post.contentType} · {post.postId}</h4>
              <p>{post.message}</p>
              <p className="muted">{post.protectedDetail ? "Verified audiences only" : "As selected"}</p>
              <div className="tag-row">
                {post.audienceIds.map((id) => <span className="tag" key={id}>{audienceLabel(id)}</span>)}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
