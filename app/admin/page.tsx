import { redirect } from "next/navigation";

// /admin is the address role-aware routing sends administrators to; it must not 404.
// The verification queue is the admin landing on this branch. When the Greencubes admin
// dashboard lands, change this target to /admin/dashboard.
export default function AdminIndexPage() {
  redirect("/admin/verification");
}
