"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RouteState, safeMessage } from "@/components/RouteState";
import { claimsAreAdmin, useAuth } from "@/components/auth/AuthProvider";
import { isPhase3LiveApi } from "@/lib/phase3";
import { landingPathFor, safeNextPath } from "@/lib/safe-next";

export function LoginForm() {
  const { status, isAdmin, error: sessionError, login, refresh } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already signed in: send members to /my-profile and admins to /admin.
  useEffect(() => {
    if (status !== "authenticated") return;
    router.replace(safeNextPath(search.get("next")) ?? landingPathFor(isAdmin));
  }, [status, isAdmin, router, search]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const claims = await login({ email: email.trim(), password });
      router.replace(safeNextPath(search.get("next")) ?? landingPathFor(claimsAreAdmin(claims)));
    } catch (cause: unknown) {
      // Never distinguish "no such account" from "wrong password", and never surface the
      // backend's own error string.
      setError(safeMessage(cause, "We could not sign you in. Check your email and password, then try again."));
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <RouteState kind="loading" title="Checking your session…" />;
  }

  if (status === "unavailable") {
    return (
      <RouteState
        kind="unavailable"
        message={sessionError ?? "Bridge could not reach the sign-in service."}
        onRetry={refresh}
        title="Sign in is unavailable right now"
      />
    );
  }

  if (status === "authenticated") {
    return <RouteState kind="loading" title="Taking you to your workspace…" />;
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Secure access</p>
      <h1>Welcome back.</h1>
      <p className="lede">Sign in to your Bridge account.</p>
      <form className="auth-form" noValidate onSubmit={submit}>
        <label htmlFor="login-email">Email address</label>
        <input
          autoComplete="username"
          id="login-email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <div className="auth-label-row">
          <label htmlFor="login-password">Password</label>
        </div>
        <input
          autoComplete="current-password"
          id="login-password"
          maxLength={128}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy || !email.trim() || !password} type="submit">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="auth-secondary">New to Bridge? <Link href="/join">Start with your role</Link></p>
      {!isPhase3LiveApi() && (
        <p className="form-hint" role="note">
          Preview mode: no Bridge API origin is configured, so sign in uses the in-memory adapter. Any email with
          an 8-character password works; an address containing &ldquo;admin&rdquo; returns administrator claims.
        </p>
      )}
    </section>
  );
}
