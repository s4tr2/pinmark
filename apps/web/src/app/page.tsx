import Link from "next/link";
import Script from "next/script";
import { BRAND_NAME, CDN_URL } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

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

export default async function LandingPage() {
  const pinCount = await demoPinCount();
  return (
    <main className="landing">
      <nav className="crumbs" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{BRAND_NAME}</span>
        <span>
          <Link href="/docs">Install guide</Link> ·{" "}
          <Link href="/login">Sign in</Link>
        </span>
      </nav>

      <h1 className="hero-title">
        Pin feedback directly on your prototype.
      </h1>
      <p className="hero-sub">
        Prototype feedback arrives as screenshots and &quot;the button feels
        off.&quot; {BRAND_NAME} pins it to the actual button: on Vercel,
        Lovable, Replit, anywhere. One script tag for you; a link and a name
        for reviewers.
      </p>

      {DEMO_KEY && (
        <>
          <p className="try-callout">
            <span className="try-dot" aria-hidden />
            <span>
              Live on this page — press <kbd>C</kbd> and click anywhere, or
              drag to comment on an area.
            </span>
          </p>
          {pinCount !== null && pinCount > 0 && (
            <p className="pin-count muted">
              {pinCount === 1
                ? "1 comment pinned on this page so far."
                : `${pinCount} comments pinned on this page so far.`}
            </p>
          )}
        </>
      )}

      <div className="hero-cta">
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
