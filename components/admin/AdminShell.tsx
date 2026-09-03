"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

// Routes that exist on this branch. Add /admin/dashboard and /admin/users here when the
// Greencubes admin screens land.
const navigation = [
  { href: "/admin/verification", label: "Verification", icon: "✓" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { claims, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const accountLabel = claims?.userId ?? "Bridge admin";

  async function signOut() {
    setIsOpen(false);
    await logout();
    router.replace("/login");
  }

  return (
    <div className="admin-shell">
      <button aria-controls="admin-nav" aria-expanded={isOpen} aria-label="Open navigation" className="admin-sidebar-toggle" onClick={() => setIsOpen(true)} type="button">
        <span aria-hidden="true">☰</span>
      </button>
      {isOpen && (
        <button aria-label="Close navigation" className="admin-sidebar-backdrop" onClick={() => setIsOpen(false)} type="button" />
      )}
      <aside className={`admin-sidebar${isOpen ? " admin-sidebar--open" : ""}`}>
        <div className="admin-sidebar-brand">
          <Image alt="" height={36} src="/bridge-mark.svg" width={58} />
          <div><strong>BRIDGE</strong><span>Admin portal</span></div>
          <button aria-label="Close navigation" className="admin-sidebar-close" onClick={() => setIsOpen(false)} type="button">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav aria-label="Admin navigation" className="admin-sidebar-nav" id="admin-nav">
          <p>Workspace</p>
          {navigation.map((item) => (
            <Link
              aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
              href={item.href}
              key={item.href}
              onClick={() => setIsOpen(false)}
            >
              <span aria-hidden="true" className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-account">
          <div aria-hidden="true" className="admin-account-avatar">{accountLabel.charAt(0).toUpperCase()}</div>
          <div className="admin-account-copy">
            <strong>{accountLabel}</strong>
            <span>Platform administrator</span>
          </div>
          <button onClick={() => { void signOut(); }} title="Sign out" type="button">
            <span aria-hidden="true">↪</span>
            <span className="sr-only">Sign out</span>
          </button>
        </div>
        <div className="admin-sidebar-org">
          <span aria-hidden="true">▣</span>
          <span>{claims?.organizationId ?? "No organization"}</span>
        </div>
      </aside>
      <div className="admin-main"><div className="admin-page">{children}</div></div>
    </div>
  );
}
