import { AdminShell } from "@/components/admin/AdminShell";
import { RequireAuth } from "@/components/auth/RequireAuth";

// RequireAuth is presentation only. See the comment in components/auth/RequireAuth.tsx:
// the API must reject every admin read and write on its own, with this layout bypassed.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth admin>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
