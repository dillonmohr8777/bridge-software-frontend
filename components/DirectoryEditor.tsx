"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { m4Api, type Business, type DirectoryLink, type DirectoryProfile, type DirectoryProfileInput, type OrganizationType } from "@/lib/m4/api";
import { normalizeProfileLinks, profileEditorPermissions, resolveOrganizationId } from "@/lib/m4/profile-editor";

const blank: DirectoryProfileInput = { businessId: "", slug: "", displayName: "", summary: null, story: null, businessType: "brand", categories: [], city: null, state: null, region: null, publicEmail: null, publicPhone: null, licenseType: null, licenseNumber: null, links: [] };
const message = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";

function profileDraft(value: DirectoryProfile): DirectoryProfileInput {
  return { businessId: value.businessId ?? "", slug: value.slug, displayName: value.displayName, summary: value.summary, story: value.story, businessType: value.businessType ?? "brand", categories: value.categories, city: value.city, state: value.state, region: value.region, publicEmail: value.publicContact.email, publicPhone: value.publicContact.phone, licenseType: value.license?.type ?? null, licenseNumber: value.license?.number ?? null, links: value.links };
}

export function DirectoryEditor() {
  const { memberships, status } = useAuth();
  const organizations = memberships.filter((item) => item.status === "active" && ["owner", "admin", "page_manager"].includes(item.role));
  const [organizationId, setOrganizationId] = useState("");
  const selectedOrganizationId = resolveOrganizationId(organizationId, organizations);
  const selected = organizations.find((item) => item.organizationId === selectedOrganizationId);
  if (status === "loading") return <p role="status">Checking your account…</p>;
  if (!selected) return <section className="content-card"><h2>Business profile</h2><p>You need an active owner, admin, or page manager membership to manage a Directory profile.</p><Link className="button primary" href="/join/organization">Create or join an organization</Link></section>;
  return <div className="form-stack"><section className="content-card"><h2>Business and Directory profile</h2><label htmlFor="m4-org">Organization</label><select id="m4-org" value={selectedOrganizationId} onChange={(event) => setOrganizationId(event.target.value)}>{organizations.map((item) => <option key={item.organizationId} value={item.organizationId}>{item.organizationName}</option>)}</select></section><OrganizationEditor key={selectedOrganizationId + ":" + selected.role} organizationId={selectedOrganizationId} role={selected.role} /></div>;
}

function OrganizationEditor({ organizationId, role }: { organizationId: string; role: string }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [profile, setProfile] = useState<DirectoryProfile | null>(null);
  const [draft, setDraft] = useState(blank);
  const [categories, setCategories] = useState("");
  const [legalName, setLegalName] = useState("");
  const [dbaName, setDbaName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);
  const [failedLoad, setFailedLoad] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([m4Api.listBusinesses(organizationId), m4Api.getProfile(organizationId)]).then(([items, value]) => {
      if (!active) return;
      setBusinesses(items); setProfile(value); setDraft(value ? profileDraft(value) : blank); setCategories(value?.categories.join(", ") ?? ""); setFailedLoad(false); setError("");
    }).catch((cause) => { if (active) { setError(message(cause)); setFailedLoad(true); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [organizationId, revision]);
  const permissions = profileEditorPermissions(role, profile);
  const field = <K extends keyof DirectoryProfileInput>(key: K, value: DirectoryProfileInput[K]) => { setDirty(true); setDraft((current) => ({ ...current, [key]: value })); };
  function changeLink(index: number, patch: Partial<DirectoryLink>) { field("links", draft.links.map((link, i) => i === index ? { ...link, ...patch } : link)); }
  async function createBusiness(event: FormEvent) {
    event.preventDefault(); if (!permissions.managesBusiness) return; setBusy("business"); setError("");
    try { const created = await m4Api.createBusiness(organizationId, { legalName: legalName.trim(), dbaName: dbaName.trim() || null }); setBusinesses((items) => [...items, created]); field("businessId", created.id); setNotice("Business created."); }
    catch (cause) { setError(message(cause)); } finally { setBusy(""); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!permissions.editable) return; setBusy("save"); setError(""); setNotice("");
    try {
      const links = normalizeProfileLinks(draft.links);
      const categoryValues = categories.split(",").map((value) => value.trim()).filter(Boolean);
      const saved = await m4Api.saveProfile(organizationId, { ...draft, slug: draft.slug.trim().toLowerCase(), displayName: draft.displayName.trim(), summary: draft.summary?.trim() || null, story: draft.story?.trim() || null, categories: categoryValues, links });
      setProfile(saved); setDraft(profileDraft(saved)); setCategories(saved.categories.join(", ")); setDirty(false); setNotice("Draft saved. Submit it for review when ready.");
    } catch (cause) { setError(message(cause)); } finally { setBusy(""); }
  }
  async function submit() {
    if (!permissions.canSubmit || dirty || !window.confirm("Submit this profile for administrator review?")) return; setBusy("submit"); setError("");
    try { setProfile(await m4Api.submitProfile(organizationId)); setNotice("Profile submitted for review."); }
    catch (cause) { setError(message(cause)); } finally { setBusy(""); }
  }
  async function upload() {
    if (!logo || !permissions.editable) return;
    if (logo.size > 2 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(logo.type)) { setError("Choose a PNG, JPEG, or WebP file no larger than 2 MiB."); return; }
    setBusy("logo"); setError("");
    try { setProfile(await m4Api.uploadLogo(organizationId, logo)); setLogo(null); setNotice("Logo uploaded to the working profile."); }
    catch (cause) { setError(message(cause)); } finally { setBusy(""); }
  }
  async function removeLogo() {
    if (!permissions.editable || !window.confirm("Remove this working profile logo?")) return; setBusy("logo"); setError("");
    try { setProfile(await m4Api.deleteLogo(organizationId)); setNotice("Logo removed."); }
    catch (cause) { setError(message(cause)); } finally { setBusy(""); }
  }
  if (loading) return <p role="status">Loading profile…</p>;
  if (failedLoad) return <section className="content-card"><p className="form-error" role="alert">{error}</p><button className="button secondary" onClick={() => { setLoading(true); setRevision((value) => value + 1); }} type="button">Try again</button></section>;
  return <>
    {error && <p className="form-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {profile?.workflowReason && <p className="boundary-note"><strong>Administrator feedback:</strong> {profile.workflowReason}</p>}
    {!businesses.length && permissions.managesBusiness && <form className="content-card auth-form" onSubmit={createBusiness}><h2>Create business record</h2><label>Legal name<input required maxLength={200} value={legalName} onChange={(event) => setLegalName(event.target.value)} /></label><label>DBA name<input maxLength={200} value={dbaName} onChange={(event) => setDbaName(event.target.value)} /></label><button className="button primary" disabled={!!busy}>Create business</button></form>}
    {!profile && !permissions.managesBusiness && <p className="boundary-note">An owner or admin must create the business profile before a page manager can edit it.</p>}
    {businesses.length > 0 && (profile || permissions.managesBusiness) && <form className="content-card auth-form" onSubmit={save}>
      <div className="card-topline"><h2>Directory profile</h2>{profile?.status && <span className="status-chip pending">{profile.status.replaceAll("_", " ")}</span>}</div>
      {profile?.hasPublishedVersion && <p className="boundary-note">Your last approved profile stays public while these changes are saved and reviewed.</p>}
      {profile?.status === "pending_review" && <p className="boundary-note">Saving another change returns this submission to draft.</p>}
      {!permissions.editable && <p className="boundary-note">This profile cannot currently be edited.</p>}
      <fieldset disabled={!!busy || !permissions.editable}>
        <label>Business<select required disabled={!permissions.canReassignBusiness} value={draft.businessId} onChange={(event) => field("businessId", event.target.value)}><option value="">Choose a business</option>{businesses.map((item) => <option key={item.id} value={item.id}>{item.dbaName || item.legalName}</option>)}</select></label>
        <label>Profile URL<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={draft.slug} onChange={(event) => field("slug", event.target.value.toLowerCase())} /></label>
        <label>Display name<input required maxLength={200} value={draft.displayName} onChange={(event) => field("displayName", event.target.value)} /></label>
        <label>Business type<select value={draft.businessType} onChange={(event) => field("businessType", event.target.value as OrganizationType)}><option value="brand">Brand</option><option value="retailer">Retailer</option><option value="dispensary">Dispensary</option></select></label>
        <label>Summary<textarea rows={3} value={draft.summary ?? ""} onChange={(event) => field("summary", event.target.value || null)} /></label>
        <label>Story<textarea rows={6} value={draft.story ?? ""} onChange={(event) => field("story", event.target.value || null)} /></label>
        <label>Categories (comma separated)<input value={categories} onChange={(event) => { setCategories(event.target.value); setDirty(true); }} /></label>
        <label>City<input value={draft.city ?? ""} onChange={(event) => field("city", event.target.value || null)} /></label>
        <label>State<input value={draft.state ?? ""} onChange={(event) => field("state", event.target.value || null)} /></label>
        <label>Region<input value={draft.region ?? ""} onChange={(event) => field("region", event.target.value || null)} /></label>
        <label>Public email<input type="email" value={draft.publicEmail ?? ""} onChange={(event) => field("publicEmail", event.target.value || null)} /></label>
        <label>Public phone<input value={draft.publicPhone ?? ""} onChange={(event) => field("publicPhone", event.target.value || null)} /></label>
        <fieldset><legend>Website, menu and product links</legend>{draft.links.map((link, index) => <div className="form-stack" key={index}>
          <label>Link {index + 1} type<select value={link.type} onChange={(event) => changeLink(index, { type: event.target.value as DirectoryLink["type"] })}><option value="website">Website</option><option value="menu">Menu</option><option value="product">Product</option><option value="other">Other</option></select></label>
          <label>Link {index + 1} label<input maxLength={100} value={link.label} onChange={(event) => changeLink(index, { label: event.target.value })} /></label>
          <label>Link {index + 1} URL<input required type="url" value={link.url} onChange={(event) => changeLink(index, { url: event.target.value })} /></label>
          <button className="button secondary" type="button" onClick={() => field("links", draft.links.filter((_, i) => i !== index))}>Remove link {index + 1}</button>
        </div>)}<button className="button secondary" disabled={draft.links.length >= 20} type="button" onClick={() => field("links", [...draft.links, { type: "website", label: "", url: "", sortOrder: draft.links.length }])}>Add link</button></fieldset>
        <label>License type<input value={draft.licenseType ?? ""} onChange={(event) => field("licenseType", event.target.value || null)} /></label>
        <label>License number<input value={draft.licenseNumber ?? ""} onChange={(event) => field("licenseNumber", event.target.value || null)} /></label>
        <button className="button primary">{busy === "save" ? "Saving…" : "Save draft"}</button>
      </fieldset>
      {dirty && <p className="form-hint">Save your changes before submitting for review.</p>}
      {permissions.canSubmit && <button className="button secondary" disabled={!!busy || dirty} onClick={() => void submit()} type="button">{busy === "submit" ? "Submitting…" : profile?.status === "correction_requested" ? "Resubmit for review" : "Submit for review"}</button>}
      {profile?.hasPublishedVersion && <Link className="text-link" href={`/profile/${encodeURIComponent(profile.slug)}`}>View public profile</Link>}
    </form>}
    {profile && permissions.editable && <section className="content-card auth-form"><h2>Business logo</h2><label>Logo file<input accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => setLogo(event.target.files?.[0] ?? null)} /></label><div className="button-row"><button className="button primary" disabled={!logo || !!busy} onClick={() => void upload()}>{busy === "logo" ? "Working…" : "Upload logo"}</button>{profile.logoUrl && <button className="button secondary" disabled={!!busy} onClick={() => void removeLogo()}>Remove logo</button>}</div></section>}
  </>;
}
