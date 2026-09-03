import { Suspense } from "react";
import { RouteState } from "@/components/RouteState";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="page shell auth-page">
      <Suspense fallback={<RouteState kind="loading" title="Loading sign in…" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
