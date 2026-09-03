"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MemberRole } from "@/lib/types";
import { defaultJoinRole, joinRoles } from "@/lib/join-roles";

/**
 * Step 1 of 4 — role selection. This is the entry screen for /join and the only place the
 * product captures a member's role, which the organization-onboarding and verification
 * slices both depend on. Account creation is Step 2 at /join/account; it is a separate
 * screen so this one survives. Do not replace this grid with a signup card.
 */
export function JoinForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<MemberRole>(defaultJoinRole);
  const selected = joinRoles.find((role) => role.name === selectedRole) ?? joinRoles[0];

  return (
    <form
      className="join-form"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/join/account?role=${encodeURIComponent(selectedRole)}`);
      }}
    >
      <fieldset>
        <legend className="sr-only">Choose your member role</legend>
        <div className="role-grid">
          {joinRoles.map((role, index) => (
            <label className="role-card" key={role.name}>
              <input
                checked={selectedRole === role.name}
                name="role"
                onChange={() => setSelectedRole(role.name)}
                type="radio"
                value={role.name}
              />
              <span className="role-icon" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <strong>{role.name}</strong>
              <small>{role.description}</small>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="form-preview">
        <div>
          <span className="step-label">Next up</span>
          <strong>Create your Bridge account</strong>
          <small>Then {selected.nextTitle.toLowerCase()}: {selected.requirements}</small>
        </div>
        <button className="button primary" type="submit">
          Continue
        </button>
      </div>
      <p className="form-hint">Requirements shown are provisional pending the verification policy (decision D-03).</p>
      <div className="join-pricing-note">
        <div><p className="eyebrow">Founding member concept</p><strong>First six months proposed free, then $349 per month for a verified business membership.</strong></div>
        <Link className="text-link" href="/pricing">Review pricing assumptions</Link>
      </div>
      <p className="boundary-note">
        Steps 2–4 — {selected.nextTitle.toLowerCase()}, verification evidence, and review — require an
        authenticated member account, a saved organization draft, protected evidence uploads, and the
        verification review API. This preview stays at Step 1 until Miraj&rsquo;s backend contract is connected.
      </p>
    </form>
  );
}
