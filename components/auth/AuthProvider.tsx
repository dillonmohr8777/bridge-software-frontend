"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getPhase3Client } from "@/lib/phase3";
import type { CurrentUser, OrganizationMembership } from "@/lib/phase3";

type AuthContextValue = {
  status: "loading" | "authenticated" | "unauthenticated";
  user: CurrentUser | null;
  memberships: OrganizationMembership[];
  isAdmin: boolean;
  login(email: string, password: string): Promise<{ isAdmin: boolean }>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getPhase3Client(), []);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);

  useEffect(() => {
    client.getCurrentUser().then((result) => {
      setUser(result.user); setMemberships(result.memberships); setStatus("authenticated");
    }).catch(() => { setStatus("unauthenticated"); });
  }, [client]);

  const login = useCallback(async (email: string, password: string) => {
    const identity = await client.login(email, password);
    setUser(identity.user); setMemberships(identity.memberships); setStatus("authenticated");
    return { isAdmin: identity.user.platformRoles.includes("admin") };
  }, [client]);

  const logout = useCallback(async () => {
    try { await client.logout(); }
    finally { setUser(null); setMemberships([]); setStatus("unauthenticated"); }
  }, [client]);
  const value = useMemo(() => ({ status, user, memberships,
    isAdmin: user?.platformRoles.includes("admin") ?? false, login, logout }), [status, user, memberships, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
