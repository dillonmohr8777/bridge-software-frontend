import { ExploreClient } from "./explore-client";
export default function ExplorePage() {
  return (
    <div className="page shell">
      <div className="page-heading">
        <p className="eyebrow">Explore</p>
        <h1>Nationwide discovery with honest coverage</h1>
        <p className="lede small">Filter by state, category, and product terms. Favorites persist locally in this prototype. Geographic selector covers all 50 states and D.C.; sample records are limited.</p>
      </div>
      <ExploreClient />
    </div>
  );
}
