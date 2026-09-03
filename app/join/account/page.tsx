import { Suspense } from "react";
import { RouteState } from "@/components/RouteState";
import { JoinAccountForm } from "./join-account-form";

// Step 2 of 4. Account creation is its own screen so /join Step 1 (role selection) stays
// the entry point and the twelve-role grid Melissa and Tori are approving survives intact.
export default function JoinAccountPage() {
  return (
    <section className="page shell form-page">
      <Suspense fallback={<RouteState kind="loading" title="Loading your selected role…" />}>
        <JoinAccountForm />
      </Suspense>
    </section>
  );
}
