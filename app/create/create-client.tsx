"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phase3Error,
  audienceCatalog,
  canCreatePromotion,
  canPublishPost,
  contentTypes,
  applySimulatedFailure,
  getPhase3Client,
  isPhase3LiveApi,
  resolveEffectiveAudiences,
  validateUploadFile,
  type ContentType,
  type SessionClaims,
  type UploadIntent,
} from "@/lib/phase3";

type PublishStatus = "idle" | "pending" | "success" | "error";
type SessionStatus = "loading" | "ready" | "error";

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
  const [status, setStatus] = useState<PublishStatus>("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const effectiveAudiences = useMemo(
    () => resolveEffectiveAudiences(selected, protectedDetail),
    [protectedDetail, selected],
  );
  const eligible = claims ? canCreatePromotion(claims) : false;
  const canPublish = eligible && canPublishPost(selected, protectedDetail, fileError) && status !== "success";

  useEffect(() => {
    let cancelled = false;
    client.getSession()
      .then((session) => {
        if (cancelled) return;
        setClaims(session);
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
    if (!next) return;
    const problem = validateUploadFile(next);
    if (problem) {
      setFileError(problem);
      return;
    }
    setFile(next);
    setFileMeta({ name: next.name, size: next.size });
  }

  function toggleAudience(id: string) {
    if (protectedDetail && id === "adults") return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  async function publish() {
    if (!canPublish || status === "pending") return;
    setStatus("pending");
    setPublishError(null);
    try {
      applySimulatedFailure(client, simulateFailure);
      let uploadId = upload?.uploadId ?? null;
      if (file && !uploadId) {
        const intent = await client.createUploadIntent(file);
        setUpload(intent);
        uploadId = intent.uploadId;
      }
      const post = await client.createPost({
        contentType,
        message,
        uploadId,
        audienceIds: effectiveAudiences,
        protectedDetail,
      });
      setPublishedId(post.postId);
      setStatus("success");
    } catch (error: unknown) {
      setStatus("error");
      setPublishError(error instanceof Phase3Error ? error.userMessage : "The promotion could not be published.");
    }
  }

  if (sessionStatus === "loading") {
    return <p className="form-hint" aria-busy="true">Loading creator session…</p>;
  }

  if (sessionStatus === "error") {
    return <p className="form-error" role="alert">{sessionError}</p>;
  }

  if (status === "success") {
    return (
      <div className="content-card" role="status">
        <p className="eyebrow">Promotion accepted</p>
        <h2>The targeted promotion is recorded.</h2>
        <p>
          Access is limited to {effectiveAudiences.map((id) => audienceCatalog.find((item) => item.id === id)?.label).join(", ")}.
          Protected detail {protectedDetail ? "is on" : "is off"}.
        </p>
        <p className="form-hint">
          {isPhase3LiveApi()
            ? `Recorded as ${publishedId}.`
            : `Prototype adapter recorded ${publishedId}. Connect NEXT_PUBLIC_BRIDGE_API_BASE to persist through Miraj's /api/v1.`}
        </p>
      </div>
    );
  }

  return (
    <div className="create-layout">
      <form className="content-card create-form" onSubmit={(event) => { event.preventDefault(); void publish(); }}>
        {!eligible && (
          <p className="form-error" role="alert">
            This account cannot create promotions until membership is active and the organization is verified.
          </p>
        )}
        <label htmlFor="content-type">Content type</label>
        <select
          disabled={!eligible || status === "pending"}
          id="content-type"
          value={contentType}
          onChange={(event) => setContentType(event.target.value as ContentType)}
        >
          {contentTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
        <label htmlFor="message">Message</label>
        <textarea
          disabled={!eligible || status === "pending"}
          id="message"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Describe the offer or update"
        />
        <label htmlFor="asset">Asset upload</label>
        <input
          disabled={!eligible || status === "pending"}
          id="asset"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
          onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
        />
        {fileMeta && <p className="form-hint">Selected: <strong>{fileMeta.name}</strong> ({Math.round(fileMeta.size / 1024)} KB)</p>}
        {upload && <p className="form-hint">Upload intent accepted: {upload.uploadId}</p>}
        {fileError && <p className="form-error" role="alert">{fileError}</p>}
        <fieldset className="audience-fieldset">
          <legend>Audiences</legend>
          {audienceCatalog.map((audience) => {
            const disabled = !eligible || status === "pending" || (protectedDetail && audience.id === "adults");
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
            disabled={!eligible || status === "pending"}
            onChange={(event) => {
              setProtectedDetail(event.target.checked);
              if (event.target.checked) setSelected((prev) => prev.filter((id) => id !== "adults"));
            }}
          />
          <span>Include protected wholesale / business-only detail</span>
        </label>
        {protectedDetail && <p className="form-hint">Protected detail limits this post to verified audiences. Adults 21+ is disabled.</p>}
        {publishError && <p className="form-error" role="alert">{publishError}</p>}
        <button className="button primary full" type="submit" disabled={!canPublish || status === "pending"}>
          {status === "pending" ? "Publishing…" : canPublish ? "Publish promotion" : "Publish unavailable"}
        </button>
        {!canPublish && <p className="form-hint">Publish requires an eligible creator, at least one eligible audience, and a valid file (if attached).</p>}
        {!isPhase3LiveApi() && (
          <details className="demo-controls">
            <summary>Phase 3 adapter controls</summary>
            <label className="check-row">
              <input checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} type="checkbox" />
              Simulate a network failure
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
            : effectiveAudiences.map((id) => <span className="tag" key={id}>{audienceCatalog.find((item) => item.id === id)?.label}</span>)}
        </div>
        <p className="form-hint">
          {isPhase3LiveApi() ? "Publishing through the live /api/v1 contract." : "Phase 3 mock adapter. Server authorization is required in production."}
        </p>
      </aside>
    </div>
  );
}
