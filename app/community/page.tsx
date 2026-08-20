import { CommunityClient } from "./community-client";
export default function CommunityPage() {
  return (
    <div className="page shell">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">Cannabis Community News</p>
          <h1>Follow what the cannabis industry is doing now</h1>
          <p className="lede small">Scan launches, promotions, events, and member updates from cannabis businesses across the network. Compare the News grid and Classic feed using the same sample activity. The default view remains pending Tori’s decision.</p>
        </div>
      </div>
      <CommunityClient />
    </div>
  );
}
