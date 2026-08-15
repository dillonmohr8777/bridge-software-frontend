"use client";
import { useMemo, useState } from "react";
const audiences = [
  { id: "adults", label: "Adults 21+", publicSafe: true },
  { id: "retailers", label: "Verified retailers", publicSafe: false },
  { id: "industry", label: "Industry professionals", publicSafe: false },
] as const;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX = 25 * 1024 * 1024;
export function CreateClient() {
  const [contentType, setContentType] = useState("Promotion");
  const [message, setMessage] = useState("");
  const [protectedDetail, setProtectedDetail] = useState(false);
  const [selected, setSelected] = useState<string[]>(["retailers"]);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const effectiveAudiences = useMemo(() => {
    if (!protectedDetail) return selected;
    return selected.filter((id) => id !== "adults");
  }, [protectedDetail, selected]);
  const canPublish = effectiveAudiences.length > 0 && !fileError;
  function onFile(file: File | null) {
    setFileError(null);
    setFileMeta(null);
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { setFileError("Unsupported type. Use PNG, JPEG, WebP, or PDF."); return; }
    if (file.size > MAX) { setFileError("File exceeds 25 MB."); return; }
    setFileMeta({ name: file.name, size: file.size });
  }
  function toggleAudience(id: string) {
    if (protectedDetail && id === "adults") return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  return (
    <div className="create-layout">
      <form className="content-card create-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="content-type">Content type</label>
        <select id="content-type" value={contentType} onChange={(e) => setContentType(e.target.value)}>
          <option>Promotion</option><option>Update</option><option>Event</option>
        </select>
        <label htmlFor="message">Message</label>
        <textarea id="message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the offer or update" />
        <label htmlFor="asset">Asset upload</label>
        <input id="asset" type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        {fileMeta && <p className="form-hint">Selected: <strong>{fileMeta.name}</strong> ({Math.round(fileMeta.size / 1024)} KB)</p>}
        {fileError && <p className="form-error" role="alert">{fileError}</p>}
        <fieldset className="audience-fieldset">
          <legend>Audiences</legend>
          {audiences.map((a) => {
            const disabled = protectedDetail && a.id === "adults";
            const checked = effectiveAudiences.includes(a.id);
            return (
              <label key={a.id} className="check-row">
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleAudience(a.id)} />
                <span>{a.label}{disabled ? " (removed while protected detail is on)" : ""}</span>
              </label>
            );
          })}
        </fieldset>
        <label className="check-row">
          <input type="checkbox" checked={protectedDetail} onChange={(e) => {
            setProtectedDetail(e.target.checked);
            if (e.target.checked) setSelected((prev) => prev.filter((id) => id !== "adults"));
          }} />
          <span>Include protected wholesale / business-only detail</span>
        </label>
        {protectedDetail && <p className="form-hint">Protected detail limits this post to verified audiences. Adults 21+ is disabled.</p>}
        <button className="button primary full" type="button" disabled={!canPublish}>{canPublish ? "Publish (prototype)" : "Publish unavailable"}</button>
        {!canPublish && <p className="form-hint">Publish requires at least one eligible audience and a valid file (if attached).</p>}
      </form>
      <aside className="content-card create-preview" aria-live="polite">
        <p className="eyebrow">Preview</p>
        <h3>{contentType}</h3>
        <p>{message || "Message preview appears here."}</p>
        {fileMeta && <p className="muted">Asset: {fileMeta.name}</p>}
        <p className="muted">Access level: {protectedDetail ? "Verified audiences only" : "As selected"}</p>
        <div className="tag-row">
          {effectiveAudiences.length === 0 ? <span className="tag">No eligible audience</span> : effectiveAudiences.map((id) => {
            const a = audiences.find((x) => x.id === id);
            return <span className="tag" key={id}>{a?.label}</span>;
          })}
        </div>
        <p className="form-hint">Prototype only. Server authorization is required in production.</p>
      </aside>
    </div>
  );
}
