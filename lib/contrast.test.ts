import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AA_LARGE_TEXT,
  AA_NORMAL_TEXT,
  contrastRatio,
  meetsAA,
  relativeLuminance,
} from "./contrast.ts";

test("contrast ratio matches the WCAG reference values", () => {
  assert.equal(Number(contrastRatio("#ffffff", "#000000").toFixed(2)), 21);
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
  // Known WCAG worked example: #777777 on white is 4.48:1, just under AA.
  assert.equal(Number(contrastRatio("#777777", "#ffffff").toFixed(2)), 4.48);
  assert.equal(meetsAA("#777777", "#ffffff"), false);
  assert.equal(meetsAA("#767676", "#ffffff"), true);
  assert.equal(relativeLuminance("#000000"), 0);
  assert.equal(relativeLuminance("#ffffff"), 1);
});

test("contrast ratio is symmetric and rejects malformed colours", () => {
  assert.equal(contrastRatio("#12324a", "#ffffff"), contrastRatio("#ffffff", "#12324a"));
  assert.equal(contrastRatio("#fff", "#000"), contrastRatio("#ffffff", "#000000"));
  assert.throws(() => contrastRatio("not-a-colour", "#ffffff"));
});

/**
 * The tokens are read straight out of app/globals.css rather than copied here, so the
 * measured values can never drift from the ones the app actually ships.
 */
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function tokensForSelector(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, `app/globals.css no longer contains ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  const block = css.slice(open + 1, close);
  const tokens: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens[name] = value;
  }
  return tokens;
}

// The network palette is declared on the bare :root; the other two override it.
const networkTokens = tokensForSelector(":root,");
const themes: Record<string, Record<string, string>> = {
  network: networkTokens,
  current: { ...networkTokens, ...tokensForSelector('[data-theme="current"]') },
  botanical: { ...networkTokens, ...tokensForSelector('[data-theme="botanical"]') },
};

/**
 * Every foreground/background token pair the app renders as text, including the admin
 * portal after retokenisation. `large` marks pairs used only at >=24px or >=18.66px bold.
 */
const textPairs: { foreground: string; background: string; large?: boolean; usage: string }[] = [
  { foreground: "text", background: "canvas", usage: "body copy on the page ground" },
  { foreground: "text", background: "surface", usage: "card copy, admin sidebar brand" },
  { foreground: "text", background: "surface-alt", usage: "admin sidebar hover, active nav item" },
  { foreground: "muted", background: "canvas", usage: "supporting copy" },
  { foreground: "muted", background: "surface", usage: "admin WORKSPACE label, account email, card subtitles" },
  { foreground: "muted", background: "surface-alt", usage: "admin sidebar meta on hovered rows" },
  { foreground: "on-brand", background: "brand", usage: "primary button label, skip link" },
  { foreground: "danger", background: "surface", usage: "form errors" },
  { foreground: "danger", background: "canvas", usage: "form errors on the page ground" },
  { foreground: "success", background: "surface", usage: "admin status text" },
  { foreground: "accent", background: "surface", large: true, usage: "admin eyebrow, links on cards" },
];

test("every theme declares the semantic tokens the app renders text with", () => {
  const needed = new Set(textPairs.flatMap((pair) => [pair.foreground, pair.background]));
  for (const [theme, tokens] of Object.entries(themes)) {
    for (const token of needed) {
      assert.ok(tokens[token], `${theme} theme is missing --${token}`);
    }
  }
});

// Automated WCAG 2.2 AA check across every Bridge theme. This is the regression guard for
// the admin-portal contrast failures: the portal now uses --text/--muted/--accent/--success
// on --canvas/--surface/--surface-alt, so those exact pairs are measured here.
for (const [theme, tokens] of Object.entries(themes)) {
  test(`${theme} theme meets WCAG AA for every rendered text pair`, () => {
    const failures: string[] = [];
    for (const pair of textPairs) {
      const foreground = tokens[pair.foreground];
      const background = tokens[pair.background];
      const ratio = contrastRatio(foreground, background);
      const required = pair.large ? AA_LARGE_TEXT : AA_NORMAL_TEXT;
      if (ratio < required) {
        failures.push(
          `--${pair.foreground} (${foreground}) on --${pair.background} (${background}) = ` +
          `${ratio.toFixed(2)}:1, needs ${required}:1 — ${pair.usage}`,
        );
      }
    }
    assert.deepEqual(failures, [], `${theme}:\n  ${failures.join("\n  ")}`);
  });
}

test("the admin portal declares no raw hex colours of its own", () => {
  const start = css.indexOf("   Admin portal.");
  assert.notEqual(start, -1, "the admin portal CSS block is gone");
  const block = css.slice(start);
  const rawHex = [...block.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) => match[0]);
  assert.deepEqual(rawHex, [], `admin portal reintroduced a private palette: ${rawHex.join(", ")}`);
});

test("the skip link is never hidden on admin pages", () => {
  // WCAG 2.4.1 bypass-blocks. The admin shell may hide the site header and footer.
  assert.doesNotMatch(css, /admin-shell\)[^{]*\.skip-link[^{]*\{[^}]*display:\s*none/);
  assert.match(css, /\.skip-link\s*\{[^}]*position:\s*fixed/);
});
