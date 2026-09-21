"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { canEditOrganization, getBridgeApiBase, getPhase3Client, Phase3Error, type OrganizationRecord } from "@/lib/phase3";
import { DirectoryClient, directoryRoles, type DirectoryInput, type DirectoryProfile } from "@/lib/phase3/directory";

const empty: DirectoryInput = { slug: "", name: "", companyName: "", description: "", location: "", state: "", serviceTerritories: [], products: [], categories: [], logoUrl: null, visibility: "private" };
const textFields = { slug: "Profile URL name", name: "Display name", companyName: "Company name", location: "City / location", state: "State abbreviation", logoUrl: "Logo URL (HTTPS)" } as const;
const listFields = { serviceTerritories: "Service territories (two-letter state codes)", products: "Products", categories: "Categories" } as const;
export function DirectoryEditor() {
  const client = useMemo(() => new DirectoryClient(getBridgeApiBase()!), []);
  const organizationsClient = useMemo(() => getPhase3Client(), []);
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [selected, setSelected] = useState<DirectoryProfile | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [draft, setDraft] = useState<DirectoryInput>({ ...empty });
  const [lists, setLists] = useState({ serviceTerritories: "", products: "", categories: "" });
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [retry, setRetry] = useState(0);
  const saving = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.all([client.mine(), organizationsClient.listOrganizations()]).then(([mine, orgs]) => { if (active) { setProfiles(mine.profiles); setOrganizations(orgs.organizations.filter(canEditOrganization)); setReady(true); } }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load your listings."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [client, organizationsClient, retry]);
  function select(profile: DirectoryProfile | null) {
    setSelected(profile); setMessage(""); setError("");
    setDraft(profile ? Object.fromEntries(Object.keys(empty).map((key) => [key, profile[key as keyof DirectoryInput]])) as DirectoryInput : { ...empty });
    setLists({ serviceTerritories: profile?.serviceTerritories.join(", ") ?? "", products: profile?.products.join(", ") ?? "", categories: profile?.categories.join(", ") ?? "" });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving.current || !ready || loading || (!selected && uncertain)) return;
    saving.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const input = { ...draft, name: draft.name.trim(), ...Object.fromEntries(Object.entries(lists).map(([key, value]) => [key, [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))]])), ...(!selected && organizationId ? { organizationId } : {}) };
      const { profile } = await client.save(selected?.id ?? null, input);
      setProfiles((current) => [...current.filter((item) => item.id !== profile.id), profile]); select(profile);
      setUncertain(false); setMessage(profile.visibility === "public" ? "Public listing saved." : "Private draft saved. It does not appear in public search.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The save could not be confirmed.");
      if (!selected && (!(cause instanceof Phase3Error) || cause.code === "unavailable")) setUncertain(true);
    } finally { saving.current = false; setBusy(false); }
  }
  return <section className="content-card"><h2>Your directory listing</h2><p>Start with a private draft. Public listings appear in Explore; verification is managed by Bridge.</p>
    {loading && <p role="status">Loading your listings…</p>}{error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status">{message}</p>}
    <div className="auth-form"><label htmlFor="directory-owned">Your listings</label><select id="directory-owned" value={selected?.id ?? ""} disabled={busy || loading || !ready} onChange={(event) => select(profiles.find((profile) => profile.id === event.target.value) ?? null)}><option value="">Create a listing</option>{profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name} ({profile.visibility})</option>)}</select><button type="button" className="button secondary" disabled={busy || loading} onClick={() => { setLoading(true); setReady(false); setError(""); setRetry((value) => value + 1); }}>Refresh listings</button></div>
    {uncertain && <p className="boundary-note">Creation could not be confirmed. Refresh and select the listing if it was created. To avoid duplicates, creating another listing is disabled until you reload this page after checking the list.</p>}
    {ready && <form className="auth-form" onSubmit={submit}><fieldset disabled={busy || loading} style={{ border: 0, padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
      {!selected ? <><label htmlFor="directory-owner">Listing owner</label><select id="directory-owner" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}><option value="">Personal sales rep profile</option>{organizations.filter((org) => org.organizationType).map((org) => <option key={org.id} value={org.id}>{org.name} ({org.organizationType})</option>)}</select><p className="form-hint">Organization listings require an active owner or admin membership. <Link className="text-link" href="/join/organization">Manage organizations</Link></p></> : <p>Type: {directoryRoles[selected.role]} · Verification: {selected.verificationStatus}</p>}
      {Object.entries(textFields).map(([key, label]) => <div className="contact-edit" key={key}><label htmlFor={`listing-${key}`}>{label}</label><input id={`listing-${key}`} value={draft[key as keyof typeof textFields] ?? ""} required={key === "slug" || key === "name"} type={key === "logoUrl" ? "url" : "text"} maxLength={key === "state" ? 2 : key === "slug" ? 80 : key === "logoUrl" ? 2048 : 200} onChange={(event) => setDraft((current) => ({ ...current, [key]: key === "logoUrl" ? event.target.value || null : key === "state" ? event.target.value.toUpperCase() : event.target.value }))} /></div>)}
      <label htmlFor="listing-description">Description</label><textarea id="listing-description" rows={5} maxLength={5000} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
      {Object.entries(listFields).map(([key, label]) => <div className="contact-edit" key={key}><label htmlFor={`listing-${key}`}>{label} (comma separated)</label><input id={`listing-${key}`} value={lists[key as keyof typeof lists]} onChange={(event) => setLists((current) => ({ ...current, [key]: event.target.value }))} /></div>)}
      <label htmlFor="listing-visibility">Visibility</label><select id="listing-visibility" value={draft.visibility} onChange={(event) => setDraft((current) => ({ ...current, visibility: event.target.value as DirectoryInput["visibility"] }))}><option value="private">Private draft</option><option value="public">Public in the directory</option></select>
      <button className="button primary" type="submit" disabled={!selected && uncertain}>{busy ? "Saving…" : draft.visibility === "public" ? "Save public listing" : "Save private draft"}</button>
      {selected?.visibility === "public" && <Link className="text-link" href={`/profile/${encodeURIComponent(selected.slug)}`}>View public listing</Link>}
    </fieldset></form>}
  </section>;
}
