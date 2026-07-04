import Image from "next/image";
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

// No decorative pins: the live widget's real pins — placed by actual
// visitors — are the "page under review" concept, fulfilled honestly.
// Fake pins would collide with real numbering (and did).

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

      <Image
        src="/press-c.png"
        alt="A hand holding a single orange keyboard key labeled C — the Pinmark comment shortcut"
        width={680}
        height={850}
        className="press-c"
        priority={false}
      />

      <div className="sticky-note" aria-hidden="true">
        <span className="sticky-tape" />
        <span className="sticky-strike">check screenshots in Slack</span>
      </div>
      <span className="specimen" aria-hidden="true">
        FIG. 01 — THE SHORTCUT
      </span>

      <h1 className="hero-title landing-reveal landing-reveal-2">
        Pin feedback{" "}
        <em className="hero-em">
          directly
          <svg
            className="pen-circle"
            viewBox="0 0 132 52"
            aria-hidden="true"
            fill="none"
          >
            <path
              pathLength="100"
              d="M14 30 C 10 12, 96 2, 120 14 C 134 22, 122 44, 62 47 C 28 48, 8 42, 12 28 C 14 21, 26 15, 40 12"
            />
          </svg>
        </em>{" "}
        on your prototype.
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
        <span className="tape tape-br" aria-hidden="true" />
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
        <span className="stamp" aria-hidden="true">
          Resolved ✓
        </span>
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
