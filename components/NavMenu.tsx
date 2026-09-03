"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const publicLinks = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/community", label: "Community News", match: (p: string) => p.startsWith("/community") },
  { href: "/create", label: "Create", match: (p: string) => p.startsWith("/create") },
  { href: "/my-profile", label: "My Profile", match: (p: string) => p.startsWith("/my-profile") },
  { href: "/explore", label: "Explore", match: (p: string) => p.startsWith("/explore") || p.startsWith("/directory") },
] as const;

const adminLink = { href: "/admin", label: "Admin", match: (p: string) => p.startsWith("/admin") } as const;

export function NavMenu() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { status, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  // Showing or hiding the Admin link is presentation only. It reflects a server claim; it
  // does not grant anything. Every admin route and API call is authorized server-side.
  const links = isAdmin ? [...publicLinks, adminLink] : [...publicLinks];

  async function signOut() {
    setOpen(false);
    await logout();
    router.replace("/login");
  }

  return (
    <>
      <button
        aria-controls="site-nav"
        aria-expanded={open}
        className="nav-toggle"
        onClick={() => setOpen((value) => !value)}
        ref={toggleRef}
        type="button"
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span> Menu
      </button>
      <nav aria-label="Main navigation" data-open={open || undefined} id="site-nav">
        {links.map((link) => (
          <Link
            aria-current={link.match(pathname) ? "page" : undefined}
            href={link.href}
            key={link.href}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        {status === "authenticated" ? (
          <button className="nav-sign-out" onClick={() => { void signOut(); }} type="button">Sign out</button>
        ) : status === "unauthenticated" ? (
          <Link aria-current={pathname.startsWith("/login") ? "page" : undefined} href="/login" onClick={() => setOpen(false)}>
            Sign in
          </Link>
        ) : null}
      </nav>
    </>
  );
}
