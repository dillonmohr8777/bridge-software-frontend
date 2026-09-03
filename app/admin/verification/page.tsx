import { VerificationQueue } from "./verification-client";

// The sidebar now comes from app/admin/layout.tsx (AdminShell), so this page no longer
// renders its own duplicate admin navigation.
export default function VerificationPage() {
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">Admin workspace</p>
          <h1>Verification queue</h1>
          <p>Review business identity, licenses, and profile readiness.</p>
        </div>
        <span className="status-chip pending">Sample queue</span>
      </div>
      <VerificationQueue />
    </>
  );
}
