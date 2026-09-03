import { CommunityClient } from "./community-client";
export default function CommunityPage() {
  return (
    <div className="page shell">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">Cannabis Community News</p>
          <h1>Find out what the cannabis WORLD is working on now</h1>
          <p className="lede small">Launches, promotions, events and what operators are telling each other, across all 50 states and D.C.</p>
        </div>
      </div>
      <CommunityClient />
    </div>
  );
}
