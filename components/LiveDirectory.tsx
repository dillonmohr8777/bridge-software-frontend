"use client";
import Link from "next/link";
import Image from "next/image";
import { SaveProfileButton } from "./Engagement";
import { DirectoryRequestForm } from "./DirectoryRequests";
import { useEffect, useMemo, useState } from "react";
import { DirectoryClient, directoryRoles, type DirectoryFilters, type DirectoryPage, type DirectoryProfile } from "@/lib/phase3/directory";
import { getBridgeApiBase } from "@/lib/phase3";
import { StatusChip } from "./StatusChip";

export function DirectoryIdentity({ profile, detail = false }: { profile: DirectoryProfile; detail?: boolean }) {
  return <><div className="card-topline">{profile.logoUrl ? <Image unoptimized width={64} height={64} src={profile.logoUrl} alt={`${profile.name} logo`} style={{ objectFit: "contain" }} /> : <span className="avatar" aria-hidden="true">{profile.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("")}</span>}<StatusChip verified={profile.verified} /></div>{detail ? <h1>{profile.name}</h1> : <h2>{profile.name}</h2>}<p className="muted">{directoryRoles[profile.role]} · {[profile.location, profile.state].filter(Boolean).join(", ")}</p>{profile.companyName && <p>{profile.companyName}</p>}<p>{profile.description}</p></>;
}
export function LiveDirectory() {
  const client = useMemo(() => new DirectoryClient(getBridgeApiBase()!), []);
  const [filters, setFilters] = useState<DirectoryFilters>({ page: 1, pageSize: 24 });
  const [result, setResult] = useState<DirectoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      client.list(filters).then((value) => { if (active) setResult(value); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load the directory."); }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [client, filters, retry]);
  function change(next: DirectoryFilters) { setLoading(true); setError(""); setResult(null); setFilters((current) => ({ ...current, ...next, page: next.page ?? 1 })); }
  return <div className="directory-layout"><aside className="filter-panel" aria-label="Directory filters">
    <label htmlFor="live-directory-query">Search</label><input id="live-directory-query" type="search" placeholder="Name, company, products…" value={filters.query ?? ""} onChange={(event) => change({ query: event.target.value })} />
    <label htmlFor="live-directory-role">Member type</label><select id="live-directory-role" value={filters.role ?? ""} onChange={(event) => change({ role: event.target.value as DirectoryFilters["role"] })}><option value="">All types</option>{Object.entries(directoryRoles).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
    <label htmlFor="live-directory-state">State abbreviation</label><input id="live-directory-state" placeholder="PA" maxLength={2} value={filters.state ?? ""} onChange={(event) => change({ state: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} />
    <label htmlFor="live-directory-category">Category</label><input id="live-directory-category" value={filters.category ?? ""} onChange={(event) => change({ category: event.target.value })} />
    <label htmlFor="live-directory-product">Product</label><input id="live-directory-product" value={filters.product ?? ""} onChange={(event) => change({ product: event.target.value })} />
    <label htmlFor="live-directory-territory">Serves state</label><input id="live-directory-territory" placeholder="PA" maxLength={2} value={filters.territory ?? ""} onChange={(event) => change({ territory: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} />
    <label className="check-row"><input type="checkbox" checked={filters.verified === true} onChange={(event) => change({ verified: event.target.checked ? true : undefined })} />Verified only</label>
    <Link className="button secondary" href="/my-profile">Manage your listing</Link>
  </aside><div aria-busy={loading}>
    {loading && <p role="status">Loading directory…</p>}
    {error && <div className="empty-state"><p role="alert">{error}</p><button className="button secondary" type="button" onClick={() => { setLoading(true); setError(""); setRetry((value) => value + 1); }}>Try again</button></div>}
    {!loading && !error && result && <><p className="result-count" role="status">{result.pagination.total} member{result.pagination.total === 1 ? "" : "s"}</p>{!result.profiles.length && <div className="empty-state"><h2>No matching members</h2><p>Try another search or change your filters.</p></div>}<div className="card-grid two">{result.profiles.map((profile) => <article className="profile-card" key={profile.id}><DirectoryIdentity profile={profile} /><div className="tag-row">{profile.categories.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><Link className="button secondary" href={`/profile/${encodeURIComponent(profile.slug)}`}>View profile</Link></article>)}</div>
    {result.pagination.totalPages > 1 && <nav className="button-row" aria-label="Directory pages"><button className="button secondary" disabled={result.pagination.page <= 1} onClick={() => change({ page: result.pagination.page - 1 })}>Previous</button><span>Page {result.pagination.page} of {result.pagination.totalPages}</span><button className="button secondary" disabled={result.pagination.page >= result.pagination.totalPages} onClick={() => change({ page: result.pagination.page + 1 })}>Next</button></nav>}</>}
  </div></div>;
}

export function LiveDirectoryDetail({ identifier }: { identifier: string }) {
  const [profile, setProfile] = useState<DirectoryProfile | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    new DirectoryClient(getBridgeApiBase()!).get(identifier).then((result) => { if (active) setProfile(result.profile); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load this profile."); });
    return () => { active = false; };
  }, [identifier, retry]);
  return <section className="page shell profile-page"><Link className="text-link back-link" href="/explore">← Back to Explore</Link>{error ? <div className="empty-state"><h1>Profile unavailable</h1><p role="alert">{error}</p><p>This listing may be private or no longer available.</p><button className="button secondary" onClick={() => { setError(""); setRetry((value) => value + 1); }}>Try again</button></div> : !profile ? <p role="status">Loading profile…</p> : <article className="content-card"><DirectoryIdentity profile={profile} detail /><SaveProfileButton profileId={profile.id} />{profile.logoUrl && <p><a className="text-link" href={profile.logoUrl} target="_blank" rel="noreferrer">View company logo</a></p>}{([['Service territories', profile.serviceTerritories], ['Products', profile.products], ['Categories', profile.categories]] as const).map(([title, items]) => items.length > 0 && <section key={title}><h3>{title}</h3><div className="tag-row">{items.map((item) => <span className="tag" key={item}>{item}</span>)}</div></section>)}<section id="contact-request"><DirectoryRequestForm profileId={profile.id} profileName={profile.name} /></section></article>}</section>;
}
