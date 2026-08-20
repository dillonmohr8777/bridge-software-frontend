import { MyProfileClient } from "./my-profile-client";
export default function MyProfilePage() {
  return (
    <div className="page shell">
      <div className="page-heading">
        <p className="eyebrow">My Profile · Verified Cannabis Business</p>
        <h1>Give cannabis partners the right way to reach you</h1>
        <p className="lede small">Manage what the public sees and what verified businesses can access. Keep sales and accounting contacts current, confirm them every 90 days, and protect EIN documents from public view.</p>
      </div>
      <MyProfileClient />
    </div>
  );
}
