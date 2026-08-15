"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { profiles } from "@/lib/data";
import { StatusChip } from "@/components/StatusChip";
const STATES = ["All states","Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
const CATEGORIES = ["All categories","Brand","Dispensary","Retailer","Sales rep","Lab","Transport","Bank","Service"];
const FAVORITES_STORAGE_KEY = "bridge-phase2-favorites";
const DEFAULT_FAVORITES = ["harbor-dispensary"];
function stateFromLocation(location: string) {
  const parts = location.split(",").map((p) => p.trim());
  return parts[1] || "";
}
export function ExploreClient() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("All states");
  const [category, setCategory] = useState("All categories");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(DEFAULT_FAVORITES);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const [introStatus, setIntroStatus] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "null");
        if (Array.isArray(saved) && saved.every((value) => typeof value === "string")) {
          setFavorites(saved);
        }
      } catch {
        // Keep the safe illustrative default when storage is unavailable or invalid.
      } finally {
        setFavoritesReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!favoritesReady) return;
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Session state remains usable when persistent storage is unavailable.
    }
  }, [favorites, favoritesReady]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      if (favoritesOnly && !favorites.includes(p.slug)) return false;
      if (category !== "All categories" && p.role !== category) return false;
      const st = stateFromLocation(p.location);
      if (state !== "All states" && st !== state) return false;
      if (!q) return true;
      const hay = [p.name, p.role, p.location, p.description, p.serving, ...p.specialties].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, state, category, favoritesOnly, favorites]);
  const sampleStates = useMemo(() => {
    const set = new Set(profiles.map((p) => stateFromLocation(p.location)).filter(Boolean));
    return Array.from(set).sort();
  }, []);
  function toggleFavorite(slug: string) {
    setFavorites((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }
  const noSampleForState = state !== "All states" && !sampleStates.includes(state) && results.length === 0;
  return (
    <div className="directory-layout">
      <aside className="filter-panel">
        <label htmlFor="explore-q">Search</label>
        <input id="explore-q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Brand, strain, service…" />
        <label htmlFor="explore-state">State</label>
        <select id="explore-state" value={state} onChange={(e) => setState(e.target.value)}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <label htmlFor="explore-cat">Category</label>
        <select id="explore-cat" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <label className="check-row"><input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} /><span>Favorites only</span></label>
        <p className="form-hint">Geographic filter: 50 states + D.C. Sample records currently illustrate: {sampleStates.join(", ")}.</p>
      </aside>
      <div>
        <div className="result-bar"><p className="result-count" aria-live="polite"><strong>{results.length}</strong> result{results.length === 1 ? "" : "s"}</p></div>
        {noSampleForState && (
          <div className="empty-state">
            <h3>No sample records for {state}</h3>
            <p>The selector includes nationwide coverage. This prototype only ships illustrative records for a limited set of states ({sampleStates.join(", ")}). Empty here means no sample data — not a claim that the market is empty.</p>
          </div>
        )}
        {!noSampleForState && results.length === 0 && (
          <div className="empty-state"><h3>No matches</h3><p>Try clearing filters or switching off Favorites only.</p></div>
        )}
        <div className="card-grid two">
          {results.map((profile) => {
            const fav = favorites.includes(profile.slug);
            return (
              <article key={profile.slug} className="profile-card">
                <div className="card-topline"><span className="avatar">{profile.initials}</span><StatusChip verified={profile.verified} /></div>
                <h3>{profile.name}</h3>
                <p className="muted">{profile.role} · {profile.location}</p>
                <p>{profile.description}</p>
                <div className="tag-row">{profile.specialties.map((s) => <span className="tag" key={s}>{s}</span>)}</div>
                <div className="button-row" style={{ marginTop: "auto", paddingTop: "1rem" }}>
                  <Link className="button secondary" href={`/profile/${profile.slug}`}>View profile</Link>
                  <button type="button" className={fav ? "button primary" : "button secondary"} aria-pressed={fav} aria-label={`${fav ? "Remove" : "Add"} ${profile.name} ${fav ? "from" : "to"} favorites`} onClick={() => toggleFavorite(profile.slug)}>{fav ? "Favorited" : "Favorite"}</button>
                  <button type="button" className="button secondary" onClick={() => setIntroStatus(`Introduction request for ${profile.name} is ready for verified staff review. No contact details were disclosed.`)}>Request introduction</button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="form-hint" role="status" aria-live="polite">{introStatus || "Introduction requests are permissioned — this prototype does not auto-disclose protected contacts."}</p>
      </div>
    </div>
  );
}
