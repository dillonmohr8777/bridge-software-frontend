import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { DEFAULT_THEME, lockedTheme } from "@/lib/direction-lock";

export const metadata: Metadata = {
  title: "Bridge: The cannabis industry, connected",
  description: "A verified cannabis industry network for discovering businesses, following market activity, and reaching the right people.",
  icons: { icon: "/bridge-mark.svg" },
  // Staging previews must not be indexed.
  robots: lockedTheme ? { index: false, follow: false } : undefined,
};

// Connected-signal is the purple Modern Network review URL. Force it before
// first paint even when a Netlify site is still locked to Trusted Current.
const unifiedThemeScript = `(function(){try{var h=location.hostname;if(h==="bridge-connected-signal.netlify.app"){document.documentElement.setAttribute("data-theme","network");}}catch(e){}})();`;

// Applies the saved provisional direction before first paint so a full page
// load does not flash the default theme. Skipped on direction-locked builds
// and never allowed to override Connected purple on the unified review host.
const themeInitScript = `(function(){try{var h=location.hostname;if(h==="bridge-connected-signal.netlify.app"){document.documentElement.setAttribute("data-theme","network");return;}var t=window.localStorage.getItem("bridge-theme");if(t==="current"||t==="botanical"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme={lockedTheme ?? DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: unifiedThemeScript }} />
      </head>
      <body>
        {!lockedTheme && <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />}
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <span>Bridge discovery prototype</span>
            <span>Provisional identity · pending Tori approval</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
