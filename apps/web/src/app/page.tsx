import Link from "next/link";
import Script from "next/script";
import { BRAND_NAME, CDN_URL } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { avatarBackground, avatarInitial, avatarInk } from "@/lib/avatar";
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

function FeedbackDemo() {
  return (
    <div
      className="feedback-demo landing-reveal landing-reveal-6"
      role="img"
      aria-label="A reviewer moves to a prototype button, drops pin 3, and leaves the comment: Tighten the label before handoff."
    >
      <div className="demo-chrome" aria-hidden="true">
        <span />
        <span />
        <span />
        <div className="demo-address">preview.yourapp.dev</div>
      </div>
      <div className="demo-stage" aria-hidden="true">
        <div className="demo-prototype">
          <span className="demo-eyebrow">Project overview</span>
          <span className="demo-heading">Ready for review</span>
          <span className="demo-copy-line demo-copy-line-long" />
          <span className="demo-copy-line" />
          <span className="demo-target">Share prototype</span>
        </div>
        <span className="demo-click-ring" />
        <span className="demo-pin">3</span>
        <div className="demo-comment">
          <span className="demo-comment-meta">
            <span
              className="demo-avatar"
              style={{
                background: avatarBackground("Maya"),
                color: avatarInk("Maya"),
              }}
            >
              {avatarInitial("Maya")}
            </span>
            Maya · just now
            <span className="demo-check">✓</span>
          </span>
          <span className="demo-comment-text">
            Tighten the label before handoff.
          </span>
        </div>
        <div className="demo-cursor">
          <svg
            className="demo-cursor-art"
            viewBox="0 0 24 28"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 2.5v19.2l5.2-4.8 3.5 8 3.3-1.5-3.5-7.8h7L3 2.5Z"
              fill="var(--fg)"
              stroke="var(--bg)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
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

      <h1 className="hero-title landing-reveal landing-reveal-2">
        Pin feedback directly on your prototype.
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

      <FeedbackDemo />

      <section className="doc-section">
        <h2>How it works</h2>
        <ol className="steps">
          <li>
            <strong>Create a project.</strong> Name it, list the domains your
            prototype lives on.
          </li>
          <li>
            <strong>Paste the snippet.</strong> One script tag in the{" "}
            <code>&lt;head&gt;</code>. Redeploy.
          </li>
          <li>
            <strong>Share the link you already share.</strong> Reviewers pin
            comments on the UI itself; you reply, resolve, and triage from
            one dashboard.
          </li>
        </ol>
      </section>

      <section className="doc-section">
        <h2>Works where your prototype works</h2>
        <p className="platforms">
          Vercel · Lovable · Replit · Webflow · Framer · Netlify · Bolt · v0
          · GitHub Pages · your own server
        </p>
        <p className="muted">
          If it serves HTML, it works. <Link href="/docs">Platform guides</Link>
        </p>
      </section>

      <section className="doc-section">
        <h2>Reviewers stay anonymous</h2>
        <p>
          No reviewer accounts, ever. A guest is a first name and a random
          token in their own browser: no emails, no cookies, no tracking.
          Prefer a closed loop? Switch a project to review-link mode and the
          widget is invisible without your secret link.
        </p>
      </section>

      <footer className="muted" style={{ marginTop: "4rem", fontSize: "0.8125rem" }}>
        {BRAND_NAME} — comments for coded prototypes
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
