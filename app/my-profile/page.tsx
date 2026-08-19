import { MyProfileClient } from "./my-profile-client";
export default function MyProfilePage() {
  return (
    <div className="page shell">
      <div className="page-heading">
        <p className="eyebrow">My Profile · Phase 3 slice</p>
        <h1>Verified identity and responsible contacts</h1>
        <p className="lede small">Switch Public vs B2B views. Update sales and accounting contacts, then confirm on first login and on a 90-day cadence. EIN documents never appear publicly.</p>
      </div>
      <MyProfileClient />
    </div>
  );
}
