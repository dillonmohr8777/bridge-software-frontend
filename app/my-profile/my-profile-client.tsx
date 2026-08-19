"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phase3Error,
  canConfirmContacts,
  canViewProtectedProfile,
  applySimulatedFailure,
  getPhase3Client,
  isPhase3LiveApi,
  type ProfileProjection,
  type SessionClaims,
} from "@/lib/phase3";

type LoadStatus = "loading" | "ready" | "error";
type ConfirmStatus = "idle" | "pending" | "error";

function formatStamp(value: string | null): string {
  if (!value) return "Not confirmed";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function MyProfileClient() {
  const client = useMemo(() => getPhase3Client(), []);
  const [mode, setMode] = useState<"public" | "protected">("protected");
  const [claims, setClaims] = useState<SessionClaims | null>(null);
  const [profile, setProfile] = useState<ProfileProjection | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>("idle");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([client.getSession(), client.getProfileProjection(mode)])
      .then(([session, projection]) => {
        if (cancelled) return;
        setClaims(session);
        setProfile(projection);
        setLoadStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadStatus("error");
        setLoadError(error instanceof Phase3Error ? error.userMessage : "The profile could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [client, mode]);

  async function confirm() {
    if (!profile || confirmStatus === "pending") return;
    setConfirmStatus("pending");
    setConfirmError(null);
    try {
      applySimulatedFailure(client, simulateFailure);
      await client.confirmContacts({ organizationId: profile.organizationId });
      const next = await client.getProfileProjection(mode);
      setProfile(next);
      setConfirmStatus("idle");
    } catch (error: unknown) {
      setConfirmStatus("error");
      setConfirmError(error instanceof Phase3Error ? error.userMessage : "Contacts could not be confirmed.");
    }
  }

  const showProtected = mode === "protected" && !!claims && canViewProtectedProfile(claims);
  const canConfirm = !!claims && canConfirmContacts(claims);

  return (
    <div>
      <div className="feed-toolbar" role="group" aria-label="Profile visibility mode">
        <button type="button" className={mode === "public" ? "button primary" : "button secondary"} aria-pressed={mode === "public"} onClick={() => { if (mode === "public") return; setLoadStatus("loading"); setLoadError(null); setMode("public"); }}>Public view</button>
        <button type="button" className={mode === "protected" ? "button primary" : "button secondary"} aria-pressed={mode === "protected"} onClick={() => { if (mode === "protected") return; setLoadStatus("loading"); setLoadError(null); setMode("protected"); }}>B2B / verified view</button>
        <p className="form-hint" style={{ margin: 0 }}>Showing: <strong>{mode === "public" ? "Public" : "B2B verified"}</strong></p>
      </div>
      {loadStatus === "loading" && <p className="form-hint" aria-busy="true">Loading profile projection…</p>}
      {loadStatus === "error" && <p className="form-error" role="alert">{loadError}</p>}
      {loadStatus === "ready" && profile && (
        <div className="profile-shell content-card">
          <div className="card-topline">
            <div>
              <h2 style={{ marginBottom: 4 }}>{profile.displayName}</h2>
              <p className="muted" style={{ margin: 0 }}>{profile.roleLabel} · {profile.location} · illustrative record</p>
            </div>
            <span className={`status-chip ${profile.verificationState === "verified" ? "verified" : "pending"}`}>
              {profile.verificationState === "verified" ? "Verified" : profile.verificationState}
            </span>
          </div>
          <p>{profile.publicDescription}</p>
          <div className="tag-row">{profile.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          {showProtected ? (
            <div className="contact-blocks">
              {profile.contacts.map((contact) => (
                <section className="profile-detail" key={contact.kind}>
                  <h3>{contact.kind === "sales" ? "Sales contact" : "Accounting contact"}</h3>
                  <p><strong>{contact.name}</strong></p>
                  <p className="muted">{contact.email} · {contact.phone}</p>
                  <p className="form-hint">Protected field · not shown in Public view</p>
                </section>
              ))}
              <section className="profile-detail confirm-panel">
                <h3>Contact confirmation</h3>
                <p className="muted">First-login and recurring 90-day review. Next due: {formatStamp(profile.confirmation.nextDue)}.</p>
                {profile.confirmation.status === "confirmed"
                  ? <p className="status-chip verified">Confirmed {formatStamp(profile.confirmation.confirmedAt)}</p>
                  : <p className="status-chip pending">Confirmation needed</p>}
                <div className="button-row">
                  <button type="button" className="button primary" disabled={!canConfirm || confirmStatus === "pending"} onClick={() => void confirm()}>
                    {confirmStatus === "pending" ? "Confirming…" : "Confirm contacts"}
                  </button>
                </div>
                {confirmError && <p className="form-error" role="alert">{contactError}</p>}
                {!canConfirm && <p className="form-hint">This account cannot confirm responsible contacts.</p>}
                <p className="form-hint">
                  {isPhase3LiveApi()
                    ? "Confirmation writes through the live /api/v1 contract."
                    : "Email reminder integration is pending production. The Phase 3 adapter records actor, time, and next-due locally until staging is connected."}
                </p>
                {!isPhase3LiveApi() && (
                  <details className="demo-controls">
                    <summary>Phase 3 adapter controls</summary>
                    <label className="check-row">
                      <input checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} type="checkbox" />
                      Simulate a network failure
                    </label>
                  </details>
                )}
              </section>
            </div>
          ) : (
            <div className="profile-visibility-note">
              <p className="muted">Protected sales and accounting contacts are hidden in Public view. EIN and verification documents never appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
