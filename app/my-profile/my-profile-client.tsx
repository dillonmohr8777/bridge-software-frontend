"use client";
import { useState } from "react";
export function MyProfileClient() {
  const [mode, setMode] = useState<"public" | "b2b">("b2b");
  const [confirmed, setConfirmed] = useState(false);
  const confirmedAt = confirmed ? "Aug 6, 2026" : null;
  const nextDue = "Nov 4, 2026";
  return (
    <div>
      <div className="feed-toolbar" role="group" aria-label="Profile visibility mode">
        <button type="button" className={mode === "public" ? "button primary" : "button secondary"} aria-pressed={mode === "public"} onClick={() => setMode("public")}>Public view</button>
        <button type="button" className={mode === "b2b" ? "button primary" : "button secondary"} aria-pressed={mode === "b2b"} onClick={() => setMode("b2b")}>B2B / verified view</button>
        <p className="form-hint" style={{ margin: 0 }}>Showing: <strong>{mode === "public" ? "Public" : "B2B verified"}</strong></p>
      </div>
      <div className="profile-shell content-card">
        <div className="card-topline">
          <div>
            <h2 style={{ marginBottom: 4 }}>Harbor Dispensary</h2>
            <p className="muted" style={{ margin: 0 }}>Dispensary · Baltimore, Maryland · illustrative record</p>
          </div>
          <span className="status-chip verified">Verified</span>
        </div>
        <p>Community-first dispensary seeking premium regional partners. Public-safe description stays visible in both modes.</p>
        <div className="tag-row"><span className="tag">Retail</span><span className="tag">Education</span><span className="tag">Maryland</span></div>
        {mode === "b2b" ? (
          <div className="contact-blocks">
            <section className="profile-detail">
              <h3>Sales contact</h3>
              <p><strong>Jordan Lee</strong></p>
              <p className="muted">jordan.lee@example-harbor.invalid · (410) 555-0142</p>
              <p className="form-hint">Protected field · not shown in Public view</p>
            </section>
            <section className="profile-detail">
              <h3>Accounting contact</h3>
              <p><strong>Sam Rivera</strong></p>
              <p className="muted">sam.rivera@example-harbor.invalid · (410) 555-0198</p>
              <p className="form-hint">Protected field · not shown in Public view</p>
            </section>
            <section className="profile-detail confirm-panel">
              <h3>Contact confirmation</h3>
              <p className="muted">First-login and recurring 90-day review. Next due: {nextDue}.</p>
              {confirmed ? <p className="status-chip verified">Confirmed {confirmedAt}</p> : <p className="status-chip pending">Confirmation needed</p>}
              <div className="button-row">
                <button type="button" className="button primary" onClick={() => setConfirmed(true)}>Confirm contacts</button>
                <button type="button" className="button secondary" onClick={() => setConfirmed(false)}>Mark for update</button>
              </div>
              <p className="form-hint">Email reminder integration is pending production. Prototype records actor/time locally only.</p>
            </section>
          </div>
        ) : (
          <div className="profile-visibility-note">
            <p className="muted">Protected sales and accounting contacts are hidden in Public view. EIN and verification documents never appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
