import { CommunityClient } from "./community-client";
export default function CommunityPage() {
  return (
    <div className="page shell">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">Community News</p>
          <h1>Stories, promotions, and member signals</h1>
          <p className="lede small">Compare News grid and Classic feed using the same illustrative items. Default recommendation: News grid (pending Tori decision).</p>
        </div>
      </div>
      <CommunityClient />
    </div>
  );
}
