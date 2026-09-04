import { CommunityClient } from "./community-client";
export default function CommunityPage() {
  return (
    <div className="page shell">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">Cannabis Community News</p>
          <h1>See what the cannabis industry is up to</h1>
          <p className="lede small">Drops, deals, hiring notes, event invites: the stuff operators tell each other. All 50 states and D.C.</p>
        </div>
      </div>
      <CommunityClient />
    </div>
  );
}
