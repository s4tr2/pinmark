import Link from "next/link";
import Script from "next/script";
import { BRAND_NAME, CDN_URL } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { TactileClicks } from "./tactile-clicks";

const DEMO_KEY = process.env.NEXT_PUBLIC_DEMO_KEY;

// Refresh the live pin count every minute
export const revalidate = 60;

async function demoPinCount(): Promise<number | null> {
  if (!DEMO_KEY) return null;
  try {
    const supabase = createAdminClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("public_key", DEMO_KEY)
      .single();
    if (!project) return null;
    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .is("parent_id", null);
    return count ?? null;
  } catch {
    return null; // never let the counter break the landing page
  }
}

/**
 * Decorative margin pins: the landing page styled as a prototype under
 * review. Same visual language as the real widget's pins, so when the live
 * widget's pins appear alongside them, fiction and product are seamless.
 */
function MarginPin({
  n,
  name,
  quip,
  check,
  className,
}: {
  n: number;
  name: string;
  quip: string;
  check?: boolean;
  className: string;
}) {
  return (
    <div className={`margin-pin ${className}`} aria-hidden="true">
      <span className="mp-pin">{n}</span>
      <span className="mp-card">
        <span className="mp-meta">
          {name}
          {check && <span className="mp-check">✓</span>}
        </span>
        {quip}
      </span>
    </div>
  );
}

export default async function LandingPage() {
  const pinCount = await demoPinCount();
  return (
    <main className="landing">
      <TactileClicks />
      <nav className="crumbs landing-nav landing-reveal landing-reveal-1">
        <span>{BRAND_NAME}</span>
        <span>
          <Link href="/docs">Install guide</Link> ·{" "}
          <Link href="/login">Sign in</Link>
        </span>
      </nav>

      <MarginPin
        n={1}
        name="Maya · 2m"
        quip="this headline ships."
        className="margin-pin-1"
      />
      <MarginPin
        n={2}
        name="Arjun · just now"
        quip="wait — one script tag?"
        className="margin-pin-2"
      />
      <MarginPin
        n={3}
        name="Sam · 1h"
        quip="resolved before standup."
        check
        className="margin-pin-3"
      />

      <h1 className="hero-title landing-reveal landing-reveal-2">
        Pin feedback <em className="hero-em">directly</em> on your prototype.
      </h1>
      <p className="hero-sub landing-reveal landing-reveal-3">
        Prototype feedback arrives as screenshots and &quot;the button feels
        off.&quot; {BRAND_NAME} pins it to the actual button: on Vercel,
        Lovable, Replit, anywhere. One script tag for you; a link and a name
        for reviewers.
      </p>

      {DEMO_KEY && (
        <>
          <p className="try-callout landing-reveal landing-reveal-4">
            <span className="try-dot" aria-hidden />
            <span>
              Live on this page — press <kbd>C</kbd> and click anywhere, or
              drag to comment on an area.
            </span>
          </p>
          {pinCount !== null && pinCount > 0 && (
            <p className="pin-count muted landing-reveal landing-reveal-4">
              {pinCount === 1
                ? "1 comment pinned on this page so far."
                : `${pinCount} comments pinned on this page so far.`}
            </p>
          )}
        </>
      )}

      <div className="hero-cta landing-reveal landing-reveal-5">
        <code className="snippet">{`<script async src="${CDN_URL}/w.js" data-pinmark="pk_live_YOUR_KEY"></script>`}</code>
        <p className="row" style={{ marginTop: 10 }}>
          <Link href="/login">
            <button type="button">Get your snippet</button>
          </Link>
          <Link href="/docs" className="muted">
            or read the install guide
          </Link>
        </p>
      </div>

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
