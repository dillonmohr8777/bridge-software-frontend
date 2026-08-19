import { CreateClient } from "./create-client";
export default function CreatePage() {
  return (
    <div className="page shell">
      <div className="page-heading">
        <p className="eyebrow">Create · Phase 3 slice</p>
        <h1>Build a targeted promotion</h1>
        <p className="lede small">Upload PNG, JPEG, WebP, or PDF up to 25 MB. Choose eligible audiences. Protected business detail removes public targeting.</p>
      </div>
      <CreateClient />
    </div>
  );
}
