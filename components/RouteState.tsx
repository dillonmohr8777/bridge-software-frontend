import { Phase3Error, type Phase3ErrorCode } from "@/lib/phase3";

/**
 * Build-spec Phase 5 required states (CLAUDE_BUILD_SPEC.md, not the contract's Phase 5), in
 * one place so every route says the same thing the same way.
 *
 * Nothing here ever renders a raw Error. `safeMessage` only lets a Phase3Error's curated
 * userMessage through; anything else — a TypeError, a stack, a backend string — collapses
 * to the caller's fallback, so internals cannot leak into the UI.
 */
export type RouteStateKind = "loading" | "empty" | "error" | "forbidden" | "unavailable";

const fallbackTitles: Record<RouteStateKind, string> = {
  loading: "Loading…",
  empty: "Nothing here yet",
  error: "Something went wrong",
  forbidden: "You do not have access to this",
  unavailable: "Bridge could not reach the service",
};

/** Maps a caught value to a message that is safe to show a member. */
export function safeMessage(error: unknown, fallback: string): string {
  return error instanceof Phase3Error ? error.userMessage : fallback;
}

/** Maps a caught value to a build-spec Phase 5 state kind. */
export function stateKindFor(error: unknown): RouteStateKind {
  if (!(error instanceof Phase3Error)) return "error";
  const byCode: Record<Phase3ErrorCode, RouteStateKind> = {
    unauthenticated: "forbidden",
    forbidden: "forbidden",
    validation: "error",
    conflict: "error",
    unavailable: "unavailable",
  };
  return byCode[error.code];
}

export function RouteState({
  kind,
  title,
  message,
  onRetry,
  retryLabel = "Try again",
  children,
}: {
  kind: RouteStateKind;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: React.ReactNode;
}) {
  const isProblem = kind === "error" || kind === "forbidden" || kind === "unavailable";
  return (
    <div
      aria-busy={kind === "loading" || undefined}
      aria-live="polite"
      className={`empty-state route-state route-state-${kind}`}
      data-state={kind}
      role={isProblem ? "alert" : "status"}
    >
      <h3>{title ?? fallbackTitles[kind]}</h3>
      {message && <p>{message}</p>}
      {children}
      {onRetry && (
        <button className="button secondary route-state-retry" onClick={onRetry} type="button">
          {retryLabel}
        </button>
      )}
    </div>
  );
}
