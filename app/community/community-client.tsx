"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PostActions } from "@/components/PostActions";
import { useSocial } from "@/lib/social";
import { getPhase3Client } from "@/lib/phase3";
import type { PostRecord } from "@/lib/phase3/types";
import { US_STATE_OPTIONS } from "@/lib/states";

type FeedItem = {
  id: string;
  /* Includes the ContentType values the composer can produce, so a published
     promotion is the same shape as a sample story. */
  type: "Promotion" | "Product introduction" | "Vendor announcement" | "Industry news" | "Event" | "Education" | "Market signal" | "Service update" | "Update";
  title: string;
  org: string;
  audience: string;
  body: string;
  state: string;
  category: string;
  image: string;
  imageAlt: string;
  age: string;
  /* Set on anything the member published in this build, so the feed can mark
     it as theirs rather than passing it off as sample activity. */
  mine?: boolean;
};

const items: FeedItem[] = [
  { id: "1", type: "Promotion", title: "Fall wholesale calendar is open", org: "Cascade Canna Co.", audience: "Verified retailers", body: "Regional partners can request menus and education support through August 31.", state: "Oregon", category: "Edibles", image: "/bridge-editorial/community-oregon-edibles.webp", imageAlt: "Small-batch edible products prepared for an Oregon wholesale presentation", age: "2 hours ago" },
  { id: "2", type: "Market signal", title: "Michigan buyers are planning fall shelf resets", org: "Northstar Sales Group", audience: "Industry professionals", body: "Multi-location retailers are asking for dependable restock schedules and staff education.", state: "Michigan", category: "Retail", image: "/bridge-editorial/community-michigan-retail.webp", imageAlt: "Michigan retail buyers planning a cannabis shelf reset", age: "4 hours ago" },
  { id: "3", type: "Industry news", title: "What California operators are testing now", org: "Signal Desk Media", audience: "All Bridge members", body: "A practical look at genetics, production efficiency, and product formats moving between legal markets.", state: "California", category: "Cultivation", image: "/bridge-editorial/community-california-cultivation.webp", imageAlt: "California cultivation team inspecting healthy plants and environmental controls", age: "Today" },
  { id: "4", type: "Event", title: "Community education night with Maryland brands", org: "Harbor Dispensary", audience: "Adults 21+", body: "A public safe education event connecting customers with verified regional operators.", state: "Maryland", category: "Events", image: "/bridge-editorial/community-maryland-education.webp", imageAlt: "Adults attending a professional cannabis education event in Maryland", age: "Tomorrow" },
  { id: "5", type: "Promotion", title: "New lab verified tincture line", org: "Greenline Goods", audience: "Verified retailers", body: "Wholesale samples and education materials are available for approved retail partners.", state: "New Jersey", category: "Wellness", image: "/bridge-editorial/community-new-jersey-wellness.webp", imageAlt: "Wellness tinctures arranged for a New Jersey wholesale review", age: "Yesterday" },
  { id: "6", type: "Service update", title: "Two secure transport routes opened", org: "Purple Route Logistics", audience: "Verified businesses", body: "New Southwest Michigan pickup windows are available for retailers, laboratories, and manufacturers.", state: "Michigan", category: "Transport", image: "/bridge-editorial/community-michigan-logistics.webp", imageAlt: "Licensed Michigan transport coordinator planning secure routes", age: "Yesterday" },
  { id: "7", type: "Market signal", title: "Facility teams are booking fall maintenance", org: "Evergreen Facility Group", audience: "Industry professionals", body: "Cultivators are scheduling HVAC, electrical, and environmental control work before winter.", state: "Ohio", category: "Services", image: "/bridge-editorial/community-ohio-facility.webp", imageAlt: "Ohio facility technician servicing cultivation climate controls", age: "2 days ago" },
  { id: "8", type: "Industry news", title: "Testing teams publish new sample intake windows", org: "Great Lakes Analytics", audience: "Verified businesses", body: "Current intake contacts and scheduling guidance are now available to Michigan operators.", state: "Michigan", category: "Testing", image: "/bridge-editorial/community-michigan-testing.webp", imageAlt: "Michigan analytical laboratory team receiving sealed samples", age: "3 days ago" },
  { id: "9", type: "Product introduction", title: "A multi-store preview puts new formats in buyers' hands", org: "Mosaic Market", audience: "Verified retailers", body: "Phoenix buyers are handing new formats to staff before the next shelf set.", state: "Arizona", category: "Retail", image: "/bridge-editorial/community-arizona-retail-planning.webp", imageAlt: "Arizona dispensary buyers comparing packaged products and merchandising notes", age: "Today" },
  { id: "10", type: "Vendor announcement", title: "Midwest retailer office hours are open", org: "Northstar Sales Group", audience: "Industry professionals", body: "Bring route questions, education plans and market priorities to the Chicago session.", state: "Illinois", category: "Services", image: "/bridge-editorial/community-illinois-route-planning.webp", imageAlt: "Illinois sales representative mapping Midwest retailer routes", age: "Today" },
  { id: "11", type: "Event", title: "Local cultivators meet independent Boston buyers", org: "Union Street Collective", audience: "Verified businesses", body: "A small session for Massachusetts operators to compare supply needs and event ideas.", state: "Massachusetts", category: "Events", image: "/bridge-editorial/community-massachusetts-meetup.webp", imageAlt: "Massachusetts dispensary team speaking with local cultivation partners", age: "This week" },
  { id: "12", type: "Education", title: "Fall patient education calendar is ready for review", org: "Presque Isle Wellness", audience: "Adults 21+", body: "Product-literacy sessions in Erie. No medical or treatment claims.", state: "Pennsylvania", category: "Wellness", image: "/bridge-editorial/community-pennsylvania-education.webp", imageAlt: "Pennsylvania dispensary educator preparing product-literacy materials", age: "This week" },
  { id: "13", type: "Promotion", title: "Mountain West craft-brand office hours", org: "Front Range Reps", audience: "Verified businesses", body: "Craft founders can talk territory, retailer education and routes with a Colorado rep.", state: "Colorado", category: "Services", image: "/bridge-editorial/community-colorado-office-hours.webp", imageAlt: "Colorado territory representative meeting a craft cannabis founder", age: "Tomorrow" },
  { id: "14", type: "Event", title: "Expansion-readiness clinic for verified operators", org: "Canopy Capital Services", audience: "Verified businesses", body: "What operators should have ready before they sit down with a banking partner.", state: "Colorado", category: "Events", image: "/bridge-editorial/community-colorado-finance-clinic.webp", imageAlt: "Cannabis-aware finance advisor leading an operator readiness clinic", age: "Next week" },
  { id: "15", type: "Product introduction", title: "Packaging review brings production details forward", org: "Steel City Botanicals", audience: "Verified retailers", body: "Pittsburgh is previewing packaging, test documentation and restock expectations.", state: "Pennsylvania", category: "Testing", image: "/bridge-editorial/community-pennsylvania-packaging.webp", imageAlt: "Pennsylvania manufacturing specialist reviewing compliant packaging details", age: "Yesterday" },
  { id: "16", type: "Vendor announcement", title: "Fourth-quarter production planning is open", org: "Lake Effect Manufacturing", audience: "Verified businesses", body: "Compare lead times, packaging and capacity before you ask for an introduction.", state: "Michigan", category: "Services", image: "/bridge-editorial/community-michigan-production.webp", imageAlt: "Michigan manufacturing team reviewing production windows", age: "Yesterday" },
  { id: "17", type: "Industry news", title: "Operator interview series starts in New York", org: "Signal Desk Media", audience: "All Bridge members", body: "Operators talking plainly about what worked, what did not, and what moved between markets.", state: "New York", category: "Services", image: "/bridge-editorial/community-new-york-interview.webp", imageAlt: "New York cannabis journalist recording an operator interview", age: "2 days ago" },
  { id: "18", type: "Education", title: "Cultivar field notes focus on dependable production", org: "Golden State Genetics", audience: "Industry professionals", body: "A grower's notes on plant structure and consistency. Observations, not advice.", state: "California", category: "Cultivation", image: "/bridge-editorial/community-california-field-notes.webp", imageAlt: "California genetics specialist examining a plant and recording field notes", age: "2 days ago" },
  { id: "19", type: "Event", title: "Water-efficiency workshop moves onto the facility floor", org: "Root Zone Hydro", audience: "Verified businesses", body: "How cultivation teams trade facility-system knowledge through a Bridge introduction.", state: "California", category: "Cultivation", image: "/bridge-editorial/community-california-water-workshop.webp", imageAlt: "California cultivation team reviewing irrigation controls with a technician", age: "3 days ago" },
  { id: "20", type: "Product introduction", title: "Retailer sample kit pairs product with education", org: "Cascade Canna Co.", audience: "Verified retailers", body: "Compliant samples, merchandising notes and staff education in one kit.", state: "Oregon", category: "Edibles", image: "/bridge-editorial/community-oregon-sample-kit.webp", imageAlt: "Oregon edible producer assembling a retailer sample kit", age: "3 days ago" },
];

const categories = ["All", ...Array.from(new Set(items.map((item) => item.category)))];
const categoryImageByName: Record<string, string> = {
  All: "/bridge-network-night.webp",
  Edibles: "/bridge-editorial/community-category-edibles.webp",
  Retail: "/bridge-editorial/community-category-retail.webp",
  Cultivation: "/bridge-editorial/community-category-cultivation.webp",
  Events: "/bridge-editorial/community-category-events.webp",
  Wellness: "/bridge-editorial/community-category-wellness.webp",
  Transport: "/bridge-editorial/community-category-transport.webp",
  Services: "/bridge-editorial/community-category-services.webp",
  Testing: "/bridge-editorial/community-category-testing.webp",
};

/* First line of the message becomes the card title; the composer is a single
   free-text field, so there is nothing else to use. */
function firstLine(message: string): string {
  const [head] = message.split(String.fromCharCode(10));
  return head.trim().slice(0, 72) || "Your promotion";
}

export function CommunityClient() {
  const [layout, setLayout] = useState<"grid" | "aligned" | "classic">("grid");
  const [category, setCategory] = useState("All");
  const [state, setState] = useState("All states");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  // PostActions writes favourites to the shared social store, so the filter
  // must read the same place or the page grows two favourite systems.
  const social = useSocial();
  const [followingOnly, setFollowingOnly] = useState(false);
  /* Anything published on Create shows up here, at the top, marked as yours.
     Without this the composer posts into nothing and the loop never closes. */
  const [mine, setMine] = useState<FeedItem[]>([]);

  useEffect(() => {
    let live = true;
    getPhase3Client()
      .listPosts()
      .then((posts: PostRecord[]) => {
        if (!live) return;
        setMine(posts.map((post) => ({
          id: post.postId,
          type: post.contentType,
          title: firstLine(post.message),
          org: "Your organization",
          audience: post.protectedDetail ? "Verified audiences" : "As selected",
          body: post.message,
          state: "All states",
          category: "All",
          image: "/bridge-editorial/create-promotion-studio.webp",
          imageAlt: "",
          age: "Just now",
          mine: true,
        })));
      })
      .catch(() => { /* Signed out or the mock threw; the sample feed still renders. */ });
    return () => { live = false; };
  }, []);
  const sampleStates = useMemo(
    () => Array.from(new Set(items.map((item) => item.state))).sort(),
    [],
  );

  const allItems = useMemo(() => [...mine, ...items], [mine]);
  const visibleItems = useMemo(
    () => allItems.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (state !== "All states" && item.state !== state) return false;
      if (favoritesOnly && !social.favorites.includes(item.id)) return false;
      if (followingOnly && !social.following.includes(item.org)) return false;
      return true;
    }),
    [allItems, category, favoritesOnly, followingOnly, social.favorites, social.following, state],
  );
  const noSampleForState = state !== "All states" && !sampleStates.includes(state) && visibleItems.length === 0;

  return (
    <div>
      <div className="visual-category-rail" aria-label="Filter Community News by cannabis category">
        {categories.map((item) => (
          <button aria-pressed={category === item} className="visual-category" key={item} onClick={() => setCategory(item)} type="button">
            <span className="category-thumb grain-image" aria-hidden="true" style={{ backgroundImage: `linear-gradient(rgba(9,6,13,.08),rgba(9,6,13,.5)), url(${categoryImageByName[item]})` }} />
            <strong>{item}</strong>
          </button>
        ))}
      </div>

      <div className="feed-toolbar" aria-label="Community News controls">
        <div className="layout-toggle" role="group" aria-label="Feed layout">
          <button type="button" className={layout === "grid" ? "button primary" : "button secondary"} aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}>Visual news</button>
          <button type="button" className={layout === "aligned" ? "button primary" : "button secondary"} aria-pressed={layout === "aligned"} onClick={() => setLayout("aligned")}>Aligned rows</button>
          <button type="button" className={layout === "classic" ? "button primary" : "button secondary"} aria-pressed={layout === "classic"} onClick={() => setLayout("classic")}>Classic feed</button>
        </div>
        <label className="compact-control" htmlFor="community-state">
          Market
          <select id="community-state" value={state} onChange={(event) => setState(event.target.value)}>
            {US_STATE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="check-row favorites-control"><input checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} type="checkbox" /><span>Saved only</span></label>
        <label className="check-row favorites-control"><input checked={followingOnly} onChange={(event) => setFollowingOnly(event.target.checked)} type="checkbox" /><span>Following only</span></label>
      </div>

      <p className="review-notice">Review build. Every post below is written sample content, not live activity. The filters, layouts and saving all work for real.</p>

      <p className="feed-sample-summary" aria-live="polite"><strong>{visibleItems.length}</strong> {visibleItems.length === 1 ? "story" : "stories"} · {sampleStates.length} sample markets · all 50 states + D.C. filterable</p>

      {noSampleForState ? (
        <div className="empty-state"><h3>Nothing here yet for {state}</h3><p>Sample content only covers {sampleStates.join(", ")} so far. Empty means we have not written posts for this market, not that the market is empty.</p></div>
      ) : visibleItems.length === 0 ? (
        <div className="empty-state"><h3>No saved signals here yet</h3><p>Change the market or category, or save posts you want to keep close.</p></div>
      ) : (
        <div className={`${layout === "grid" ? "news-grid" : layout === "aligned" ? "news-aligned" : "news-classic"} editorial-feed`} data-layout={layout}>
          {visibleItems.map((item) => {
            return (
              <article key={item.id} className="content-card news-card media-card">
                <div className="grain-image news-image">
                  <Image alt={item.imageAlt} fill sizes={layout === "grid" ? "(max-width: 720px) 100vw, 50vw" : "220px"} src={item.image} />
                </div>
                <div className="news-card-copy">
                  <div className="card-topline"><span className="status-chip">{item.type}</span><span className="tag">{item.audience}</span></div>
                  <p className="eyebrow">{item.mine ? "Published by you" : `${item.state} · ${item.category}`}</p>
                  <h3>{item.title}</h3>
                  <p className="muted">{item.org} · {item.age}</p>
                  <p className="news-card-summary">{item.body}</p>
                  <div className="news-actions">
                    <PostActions postId={item.id} postTitle={item.title} />
                    <Link className="text-link" href="/explore">Explore related members</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="form-hint">No paid placement in this feed. Nothing here is a live market claim.</p>
    </div>
  );
}
