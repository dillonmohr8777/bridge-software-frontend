"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { RouteState, safeMessage, stateKindFor } from "@/components/RouteState";
import { useAuth } from "@/components/auth/AuthProvider";
import { resolveJoinRole } from "@/lib/join-roles";
import { MOCK_MIN_PASSWORD_LENGTH, isPhase3LiveApi } from "@/lib/phase3";

type Status = "idle" | "submitting" | "submitted";

export function JoinAccountForm() {
  const search = useSearchParams();
  const { register } = useAuth();
  // Unknown role values are discarded, never echoed back into the page.
  const role = useMemo(() => resolveJoinRole(search.get("role")), [search]);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<{ kind: ReturnType<typeof stateKindFor>; message: string } | null>(null);
  const [notice, setNotice] = useState("");

  const passwordTooShort = password.length > 0 && password.length < MOCK_MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const blocked = !displayName.trim() || !email.trim() || passwordTooShort || mismatch || password.length === 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (blocked || status === "submitting") return;
    setStatus("submitting");
    setError(null);
    try {
      const result = await register({ displayName: displayName.trim(), email: email.trim(), password, role: role.name });
      setNotice(result.message);
      setStatus("submitted");
    } catch (cause: unknown) {
      setError({
        kind: stateKindFor(cause),
        message: safeMessage(cause, "Your account could not be created. Nothing was submitted — try again."),
      });
      setStatus("idle");
    }
  }

  if (status === "submitted") {
    return (
      <div className="join-auth-layout">
        <RouteState kind="empty" title="Account requested">
          <p>{notice}</p>
          <p className="boundary-note">
            Steps 3 and 4 — {role.nextTitle.toLowerCase()}, verification evidence, and review — need a saved
            organization draft, protected evidence uploads, and the verification review API. This preview stops
            here until Miraj&rsquo;s backend contract is connected.
          </p>
          <p className="button-row"><Link className="button primary" href="/login">Go to sign in</Link></p>
        </RouteState>
      </div>
    );
  }

  return (
    <div className="join-auth-layout">
      <div className="join-auth-heading">
        <p className="eyebrow">Step 2 of 4</p>
        <h1>Create your Bridge account</h1>
        <p className="lede">
          You selected <strong>{role.name}</strong>. <Link className="text-link" href="/join">Change role</Link>
        </p>
      </div>
      <section className="auth-card">
        <form className="auth-form" noValidate onSubmit={submit}>
          <label htmlFor="join-name">Name other members will see</label>
          <input
            autoComplete="organization"
            id="join-name"
            onChange={(event) => setDisplayName(event.target.value)}
            required
            value={displayName}
          />

          <label htmlFor="join-email">Email address</label>
          <input
            autoComplete="username"
            id="join-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          <label htmlFor="join-password">Password</label>
          <input
            aria-describedby="join-password-hint"
            aria-invalid={passwordTooShort || undefined}
            autoComplete="new-password"
            id="join-password"
            maxLength={128}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <p className="form-hint" id="join-password-hint">At least {MOCK_MIN_PASSWORD_LENGTH} characters.</p>
          {passwordTooShort && <p className="form-error" role="alert">Use at least {MOCK_MIN_PASSWORD_LENGTH} characters.</p>}

          <label htmlFor="join-confirm">Confirm password</label>
          <input
            aria-invalid={mismatch || undefined}
            autoComplete="new-password"
            id="join-confirm"
            maxLength={128}
            onChange={(event) => setConfirm(event.target.value)}
            required
            type="password"
            value={confirm}
          />
          {mismatch && <p className="form-error" role="alert">Both passwords must match.</p>}

          {error && <p className="form-error" role="alert">{error.message}</p>}

          <button className="button primary" disabled={blocked || status === "submitting"} type="submit">
            {status === "submitting" ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="auth-secondary">Already a member? <Link href="/login">Sign in</Link></p>
      </section>
      {!isPhase3LiveApi() && (
        <p className="form-hint" role="note">
          Preview mode: no Bridge API origin is configured, so this form uses the in-memory adapter and does not
          create a real account.
        </p>
      )}
    </div>
  );
}
