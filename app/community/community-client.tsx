"use client";
import { useState } from "react";
const items = [
  { id: "1", type: "Promotion", title: "Fall wholesale calendar open", org: "Cascade Canna Co.", audience: "Verified retailers", body: "Regional partners can request menus through August 31." },
  { id: "2", type: "Update", title: "Shelf reset planning started", org: "Harbor Dispensary", audience: "Industry professionals", body: "Submitting brands should share wholesale menus by mid-September." },
  { id: "3", type: "Signal", title: "Midwest route density check", org: "Northstar Sales Group", audience: "Industry professionals", body: "Illustrative private signal — not a live market metric." },
  { id: "4", type: "Story", title: "Education night with local brands", org: "Presque Isle Wellness", audience: "Adults 21+", body: "Community education event language for public-safe audiences." },
  { id: "5", type: "Promotion", title: "New lab-verified tincture line", org: "Greenline Goods", audience: "Verified retailers", body: "Wholesale samples for verified retail partners only." },
  { id: "6", type: "Update", title: "Two-location restock window", org: "Motor City Supply Co.", audience: "Industry professionals", body: "Buying team reviewing multi-store supply partners." },
];
export function CommunityClient() {
  const [layout, setLayout] = useState<"grid" | "classic">("grid");
  return (
    <div>
      <div className="feed-toolbar" role="group" aria-label="Feed layout">
        <button type="button" className={layout === "grid" ? "button primary" : "button secondary"} aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}>News grid</button>
        <button type="button" className={layout === "classic" ? "button primary" : "button secondary"} aria-pressed={layout === "classic"} onClick={() => setLayout("classic")}>Classic feed</button>
        <p className="form-hint" style={{ margin: 0 }}>Selected: <strong>{layout === "grid" ? "News grid" : "Classic feed"}</strong> · same content both ways · Dillon recommendation: News grid</p>
      </div>
      <div className={layout === "grid" ? "news-grid" : "news-classic"} data-layout={layout}>
        {items.map((item) => (
          <article key={item.id} className="content-card news-card">
            <div className="card-topline"><span className="status-chip">{item.type}</span><span className="tag">{item.audience}</span></div>
            <h3>{item.title}</h3>
            <p className="muted" style={{ marginBottom: 8 }}>{item.org}</p>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
      <p className="form-hint">Illustrative feed items only. Not live member activity.</p>
    </div>
  );
}
