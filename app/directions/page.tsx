"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { directionNames, lockedTheme } from "@/lib/direction-lock";
import { applyTheme, useTheme, type ThemeId } from "@/lib/theme";

// Swatches must match the theme tokens in globals.css so the comparison is honest.
const directions: {
  name: string;
  id: ThemeId;
  promise: string;
  rationale: string;
  colors: string[];
  recommendation?: boolean;
}[] = [
  {
    name: "01 · Trusted Current",
    id: "current",
    promise: "Credible, useful, and distinctly B2B.",
    rationale: "Navy and teal establish trust without copying category clichés. Amber creates a human signal for introductions and pending actions.",
    colors: ["#12324A", "#0A766E", "#D9820F", "#F5F8F7"],
  },
  {
    name: "02 · Modern Network",
    id: "network",
    promise: "Bold, connected, and startup-forward.",
    rationale: "Ink, electric violet, and coral make Bridge feel like a modern software network rather than a directory listing site.",
    colors: ["#17152D", "#6556E8", "#D95848", "#F7F6FB"],
    recommendation: true,
  },
  {
    name: "03 · Botanical Ledger",
    id: "botanical",
    promise: "Grounded, premium, and industry-aware.",
    rationale: "Forest and sage acknowledge the category while restrained copper keeps the identity professional rather than dispensary-themed.",
    colors: ["#173C2C", "#4F6F57", "#B45F2A", "#F6F5EF"],
  },
];

export default function DirectionsPage() {
  const theme = useTheme();

  return (
    <section className="page shell">
      <div className="page-heading split-heading">
        <div><p className="eyebrow">Provisional brand exploration</p><h1>Three directions for Tori to react to.</h1><p className="lede">These are decision tools, not an approved Bridge identity. Choose a direction, then refine it after the prototype walkthrough.</p>{lockedTheme && <p className="form-hint">This staging build is pinned to {directionNames[lockedTheme]}. Each direction has its own staging link for side-by-side comparison.</p>}</div>
        {!lockedTheme && <ThemeSwitcher />}
      </div>
      <div className="direction-grid">
        {directions.map((direction) => (
          <article className="direction-card" key={direction.id}>
            <div className="direction-top"><span>{direction.name}</span>{direction.recommendation && <span className="status-chip verified">Recommended</span>}</div>
            <div className={`direction-preview preview-${direction.id}`}>
              <span className="preview-mark">B</span><div><strong>Build better business connections.</strong><small>Verified cannabis industry network</small></div>
            </div>
            <h2>{direction.promise}</h2>
            <p>{direction.rationale}</p>
            <div className="swatches" aria-label={`${direction.name} colors`}>{direction.colors.map((color) => <span key={color} style={{ background: color }} title={color} />)}</div>
            <button
              aria-pressed={theme === direction.id}
              className="button secondary full"
              disabled={Boolean(lockedTheme) && lockedTheme !== direction.id}
              onClick={() => applyTheme(direction.id)}
              title={lockedTheme && lockedTheme !== direction.id ? `This staging build is pinned to ${directionNames[lockedTheme]} — open that direction's staging link to compare` : undefined}
              type="button"
            >
              {lockedTheme
                ? lockedTheme === direction.id
                  ? "This build's pinned direction"
                  : `Pinned build — see the ${directionNames[direction.id]} link`
                : theme === direction.id
                  ? "Previewing across prototype"
                  : "Preview across prototype"}
            </button>
          </article>
        ))}
      </div>
      <div className="content-card meeting-note"><p className="eyebrow">Monday decision</p><h2>Ask Tori to choose attributes before colors.</h2><p>Start with: “Should Bridge feel most like trusted infrastructure, a modern professional network, or a premium industry platform?” Then use the color directions to confirm—not lead—the conversation.</p></div>
    </section>
  );
}
