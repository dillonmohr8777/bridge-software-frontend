"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Phase3Error,
  getPhase3Client,
  type AuthCredentials,
  type RegisterInput,
  type RegisterResult,
  type SessionClaims,
} from "@/lib/phase3";

/**
 * Session state is read from the API through the single Phase 3 client. No token is held
 * here and nothing is written to sessionStorage or localStorage: docs/INTEGRATION-PIPELINE.md
 * forbids access tokens in browser storage, so the session lives in an httpOnly cookie the
 * page cannot read. Reloading re-asks the server, which is the point.
 *
 * "unavailable" is a first-class status. A network failure is not the same thing as being
 * signed out, and treating it as one is how people get silently bounced to /login.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unavailable";

type AuthContextValue = {
  status: AuthStatus;
  claims: SessionClaims | null;
  isAdmin: boolean;
  error: string | null;
  refresh(): void;
  register(input: RegisterInput): Promise<RegisterResult>;
  login(input: AuthCredentials): Promise<SessionClaims>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Admin is a server claim. The UI only mirrors it. */
export function claimsAreAdmin(claims: SessionClaims | null): boolean {
  return claims?.adminScope === true || claims?.role === "admin";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getPhase3Client(), []);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [claims, setClaims] = useState<SessionClaims | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    client.getSession()
      .then((session) => {
        if (cancelled) return;
        setClaims(session);
        setError(null);
        setStatus("authenticated");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setClaims(null);
        if (cause instanceof Phase3Error && cause.code === "unauthenticated") {
          setError(null);
          setStatus("unauthenticated");
          return;
        }
        setError(cause instanceof Phase3Error ? cause.userMessage : "Your session could not be checked.");
        setStatus("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [client, reloadToken]);

  const refresh = useCallback(() => {
    setStatus("loading");
    setError(null);
    setReloadToken((value) => value + 1);
  }, []);

  const register = useCallback((input: RegisterInput) => client.register(input), [client]);

  const login = useCallback(async (input: AuthCredentials) => {
    const session = await client.login(input);
    setClaims(session);
    setError(null);
    setStatus("authenticated");
    return session;
  }, [client]);

  const logout = useCallback(async () => {
    await client.logout();
    setClaims(null);
    setError(null);
    setStatus("unauthenticated");
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    claims,
    isAdmin: claimsAreAdmin(claims),
    error,
    refresh,
    register,
    login,
    logout,
  }), [status, claims, error, refresh, register, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
