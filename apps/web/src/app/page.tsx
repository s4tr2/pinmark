import Link from "next/link";
import Script from "next/script";
import { BRAND_NAME, CDN_URL } from "@/lib/config";
import { TactileClicks } from "./tactile-clicks";

const DEMO_KEY = process.env.NEXT_PUBLIC_DEMO_KEY;

// No decorative pins: the live widget's real pins — placed by actual
// visitors — are the "page under review" concept, fulfilled honestly.
// Fake pins would collide with real numbering (and did).

export default function LandingPage() {
  return (
    <main className="landing">
      <TactileClicks />
      <nav className="crumbs landing-nav landing-reveal landing-reveal-1">
        <span>{BRAND_NAME}</span>
        <span>
          <Link href="/docs">Docs</Link> ·{" "}
          <Link href="/login">Sign in</Link>
        </span>
      </nav>

      <h1 className="hero-title landing-reveal landing-reveal-2">
        Pin feedback to your prototype.
      </h1>
      <p className="hero-sub landing-reveal landing-reveal-3">
        Add one script, then let reviewers comment on the exact UI—no accounts
        or screenshots.
      </p>

      <div className="hero-cta landing-reveal landing-reveal-4">
        <p className="row hero-actions">
          <Link href="/login">
            <button type="button">Get your snippet</button>
          </Link>
          <Link href="/docs" className="muted">
            Install guide
          </Link>
        </p>
      </div>

      {DEMO_KEY && (
        <p className="try-callout landing-reveal landing-reveal-5">
          <span className="try-dot" aria-hidden />
          <span>
            Try it here — press <kbd>C</kbd>, then click or drag.
          </span>
        </p>
      )}

      <section className="landing-section">
        <h2 className="landing-h2">How it works</h2>
        <div className="steps-grid">
          <div className="step">
            <span className="step-num">01</span>
            <p>
              <strong>Create a project.</strong> Name it, list the domains
              your prototype lives on.
            </p>
          </div>
          <div className="step">
            <span className="step-num">02</span>
            <p>
              <strong>Paste the snippet.</strong> One script tag in the{" "}
              <code>&lt;head&gt;</code>. Redeploy.
            </p>
          </div>
          <div className="step">
            <span className="step-num">03</span>
            <p>
              <strong>Share the link you already share.</strong> Reviewers
              pin comments on the UI itself; you triage from one dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-h2">Works where your prototype works</h2>
        <p className="platforms">
          Vercel · Lovable · Replit · Webflow · Framer · Netlify · Bolt · v0
          · GitHub Pages · your own server
        </p>
        <p className="muted">
          If it serves HTML, it works. <Link href="/docs">Platform guides</Link>
        </p>
      </section>

      <section className="landing-section">
        <h2 className="landing-h2">Reviewers stay anonymous</h2>
        <p style={{ maxWidth: "52ch" }}>
          No reviewer accounts, ever. A guest is a first name and a random
          token in their own browser: no emails, no cookies, no tracking.
          Prefer a closed loop? Switch a project to review-link mode and the
          widget is invisible without your secret link.
        </p>
      </section>

      <footer className="landing-footer">
        <span className="footer-mark">{BRAND_NAME}</span>
        <span className="muted">comments for coded prototypes</span>
      </footer>

      {DEMO_KEY && (
        <Script
          src={`${CDN_URL}/w.js`}
          data-pinmark={DEMO_KEY}
          strategy="afterInteractive"
        />
      )}
    </main>
  );
}
