"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { RouteState } from "@/components/RouteState";
import { useAuth } from "./AuthProvider";

/**
 * Client-side routing is PRESENTATION ONLY. It decides what this browser draws; it is not
 * an authorization boundary and must never be treated as one. Anyone can edit the bundle,
 * skip the redirect, or call the API directly. Every protected read and every mutation is
 * authorized server-side from the session claims listed in docs/INTEGRATION-API-CONTRACT.md,
 * and the API must still return 401/403 when this component is bypassed.
 */
export function RequireAuth({ admin = false, children }: { admin?: boolean; children: React.ReactNode }) {
  const { status, isAdmin, error, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    if (status === "unauthenticated") {
      redirected.current = true;
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return <div className="page shell"><RouteState kind="loading" title="Checking your access…" /></div>;
  }

  if (status === "unavailable") {
    return (
      <div className="page shell">
        <RouteState
          kind="unavailable"
          message={error ?? "Your session could not be checked. Nothing was lost."}
          onRetry={refresh}
          title="Bridge could not confirm your session"
        />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <div className="page shell"><RouteState kind="loading" title="Taking you to sign in…" /></div>;
  }

  if (admin && !isAdmin) {
    return (
      <div className="page shell">
        <RouteState kind="forbidden" message="This area is limited to Bridge platform administrators." title="Administrator access required">
          <p className="button-row"><Link className="button secondary" href="/my-profile">Go to my profile</Link></p>
        </RouteState>
      </div>
    );
  }

  return children;
}
