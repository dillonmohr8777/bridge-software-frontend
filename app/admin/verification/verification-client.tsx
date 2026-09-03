"use client";

import { useEffect, useMemo, useState } from "react";
import { getPhase3Client } from "@/lib/phase3";

type QueueRow = {
  id: string;
  organization: string;
  itemType: string;
  status: string;
  submittedAt: string | null;
};

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function queueRecords(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = record(payload);
  if (!root) return [];
  for (const key of ["cases", "queue", "items", "verificationCases", "data"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  const nestedData = record(root.data);
  if (nestedData) {
    for (const key of ["cases", "queue", "items", "verificationCases"]) {
      if (Array.isArray(nestedData[key])) return nestedData[key] as unknown[];
    }
  }
  return [];
}

function normalizeQueue(payload: unknown): QueueRow[] {
  return queueRecords(payload).flatMap((value, index) => {
    const item = record(value);
    if (!item) return [];
    const organization = record(item.organization);
    const id = text(item.verificationCaseId) ?? text(item.caseId) ?? text(item.id) ?? `queue-${index}`;
    return [{
      id,
      organization: text(item.organizationName) ?? text(item.businessName) ?? text(organization?.name) ?? "Unnamed organization",
      itemType: text(item.itemType) ?? text(item.organizationType) ?? text(item.type) ?? "—",
      status: text(item.status) ?? text(item.verificationStatus) ?? "pending",
      submittedAt: text(item.submittedAt) ?? text(item.createdAt) ?? text(item.updatedAt),
    }];
  });
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function VerificationQueue() {
  const client = useMemo(() => getPhase3Client(), []);
  const [payload, setPayload] = useState<unknown>(null);
  const [status, setStatus] = useState("");
  const [itemType, setItemType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setError("");
      client.getVerificationQueue({ status: status || undefined, itemType: itemType || undefined, limit: 50 })
        .then((response) => { if (active) setPayload(response); })
        .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "The verification queue could not be loaded."); })
        .finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; };
  }, [client, status, itemType, reload]);

  const rows = useMemo(() => normalizeQueue(payload), [payload]);

  return <>
    <section className="admin-content-card admin-user-filters" aria-label="Verification queue filters">
      <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Default active queue</option><option value="pending">Pending</option><option value="in_review">In review</option><option value="verification_requested">Verification requested</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="correction_required">Correction required</option><option value="not_applicable">Not applicable</option></select></label>
      <label><span>Item type</span><select value={itemType} onChange={(event) => setItemType(event.target.value)}><option value="">All item types</option><option value="ein">EIN</option><option value="cannabis_license">Cannabis license</option><option value="business_registration">Business registration</option><option value="document">Document</option></select></label>
    </section>
    <div className="content-card table-card">
      <div className="result-bar"><strong>{rows.length} queue items</strong><span className="status-chip pending">Live API</span></div>
      {loading && <p className="admin-users-empty" role="status">Loading verification queue…</p>}
      {!loading && error && <div className="admin-users-error" role="alert"><p>{error}</p><button className="button" onClick={() => setReload((value) => value + 1)} type="button">Try again</button></div>}
      {!loading && !error && <div className="table-scroll"><table><thead><tr><th>Organization</th><th>Type</th><th>Status</th><th>Submitted</th><th>Case ID</th></tr></thead><tbody>
        {rows.map((item) => <tr key={item.id}><td><strong>{item.organization}</strong></td><td>{label(item.itemType)}</td><td><span className={`status-chip ${item.status === "verified" ? "verified" : item.status === "rejected" || item.status === "correction_required" ? "warning" : "pending"}`}>{label(item.status)}</span></td><td>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}</td><td><code>{item.id}</code></td></tr>)}
        {!rows.length && <tr><td className="admin-users-empty" colSpan={5}>No verification cases match these filters.</td></tr>}
      </tbody></table></div>}
    </div>
  </>;
}
