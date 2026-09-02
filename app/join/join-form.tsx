"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthApiError, authApi } from "@/lib/auth/api";

export function JoinForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Enter your display name.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Enter the same password in both fields.");
      return;
    }
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Use at least 12 characters with uppercase, lowercase, a number, and a special character.");
      return;
    }

    setBusy(true);
    try {
      await authApi.register(email.trim(), password, displayName.trim());
      setComplete(true);
    } catch (caught) {
      if (caught instanceof AuthApiError && caught.status === 409) {
        setError("An account already exists for this email. Sign in or reset your password.");
      } else {
        setError(caught instanceof AuthApiError ? caught.message : "Your account could not be created. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (complete) {
    return (
      <section className="auth-card">
        <p className="eyebrow">Check your inbox</p>
        <h2>Confirm your email.</h2>
        <p className="lede">We sent a confirmation link to <strong>{email}</strong>. Open it before signing in.</p>
        <p className="boundary-note">After confirmation, sign in and continue setting up your Bridge profile.</p>
        <Link className="button primary" href="/login">Continue to sign in</Link>
        <p className="auth-secondary">Didn&apos;t receive it? <Link href="/auth/verify-email">Resend verification email</Link></p>
      </section>
    );
  }

  return (
    <section className="auth-card">
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="display-name">Display name</label>
        <input id="display-name" autoComplete="name" maxLength={100} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />

        <label htmlFor="email">Email address</label>
        <input id="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="new-password" maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
        <p className="form-hint">At least 12 characters, including uppercase, lowercase, a number, and a special character.</p>

        <label htmlFor="confirm-password">Confirm password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy} type="submit">{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="auth-secondary">Already have an account? <Link href="/login">Sign in</Link></p>
    </section>
  );
}
