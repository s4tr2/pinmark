import Link from "next/link";
import { redirect } from "next/navigation";
import { BRAND_NAME, SELF_HOSTED } from "@/lib/config";
import { PinmarkLogo } from "./pinmark-logo";
import { ScrollReveal } from "./scroll-reveal";
import { SiteNav } from "./site-nav";
import { TactileClicks } from "./tactile-clicks";

const PLATFORMS = [
  { name: "Vercel", domain: "vercel.com", guide: "nextjs" },
  { name: "Lovable", domain: "lovable.dev", guide: "lovable" },
  { name: "Replit", domain: "replit.com", guide: "replit" },
  { name: "Webflow", domain: "webflow.com", guide: "webflow" },
  { name: "Framer", domain: "framer.com", guide: "framer" },
  { name: "Netlify", domain: "netlify.com", guide: "netlify" },
  { name: "Bolt", domain: "bolt.new", guide: "bolt" },
  { name: "v0", domain: "v0.dev", guide: "bolt" },
  { name: "GitHub Pages", domain: "github.com", guide: "html" },
] as const;

export default function LandingPage() {
  // Self-hosted instances serve the product, not the marketing site.
  // /login itself redirects on to /dashboard when already signed in.
  if (SELF_HOSTED) redirect("/login");

  return (
    <main className="landing" id="landing-page">
      <ScrollReveal rootId="landing-page" />
      <TactileClicks />
      <SiteNav active="home" />

      <h1 className="hero-title landing-reveal landing-reveal-2">
        Pin{" "}
        <span className="hero-feedback-demo">
          <span className="hero-feedback-highlight" aria-hidden />
          <span className="hero-feedback-word">feedback</span>
          <span className="hero-feedback-cursor" aria-hidden>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M5 3.5 19 12l-6.15 1.05 3.2 5.35-2.8 1.65-3.15-5.3L5 18.5v-15Z" />
            </svg>
          </span>
          <span className="hero-feedback-pin" aria-hidden>
            M
          </span>
          <span className="hero-feedback-comment" aria-hidden>
            <span className="hero-feedback-comment-meta">
              <strong>Maya</strong> · just now
            </span>
            <span className="hero-feedback-comment-body">
              Can this be more specific?
            </span>
          </span>
        </span>{" "}
        to your prototype.
      </h1>
      <p className="hero-sub landing-reveal landing-reveal-3">
        Add one script, then let reviewers comment on the exact UI. No accounts
        or screenshots required.
      </p>

      <div className="hero-cta landing-reveal landing-reveal-4">
        <p className="row hero-actions">
          <Link href="/login">
            <button type="button">Get your snippet</button>
          </Link>
          <Link href="/playground" className="muted">
            Try the playground
          </Link>
        </p>
      </div>

      <section className="landing-section" data-scroll-reveal>
        <h2 className="landing-h2">Works where your prototype works</h2>
        <ul className="platform-grid" aria-label="Supported platforms">
          {PLATFORMS.map((platform) => (
            <li className="platform-item" key={platform.name}>
              <Link
                className="platform-link"
                href={`/docs#${platform.guide}`}
                aria-label={`Install Pinmark on ${platform.name}`}
              >
                <img
                  className="platform-logo"
                  src={`https://icons.duckduckgo.com/ip3/${platform.domain}.ico`}
                  alt=""
                  width={20}
                  height={20}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <span>{platform.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="muted">
          Plus your own server. If it serves HTML, it works.{" "}
          <Link href="/docs">Platform guides</Link>
        </p>
      </section>

      <section className="landing-section" data-scroll-reveal>
        <h2 className="landing-h2">How it works</h2>
        <ol className="steps-grid">
          <li className="step">
            <div className="step-heading">
              <span className="step-num">01</span>
              <h3>Create a project</h3>
            </div>
            <p>Add the domains where your prototype lives.</p>
          </li>
          <li className="step">
            <div className="step-heading">
              <span className="step-num">02</span>
              <h3>Paste the snippet</h3>
            </div>
            <p>
              Add one script tag to <code>&lt;head&gt;</code>, then redeploy.
            </p>
          </li>
          <li className="step">
            <div className="step-heading">
              <span className="step-num">03</span>
              <h3>Share your prototype</h3>
            </div>
            <p>Reviewers pin feedback directly on the UI.</p>
          </li>
        </ol>
      </section>

      <section
        className="landing-section deployment-section"
        data-scroll-reveal
      >
        <div className="deployment-heading">
          <p className="deployment-kicker">Deployment</p>
          <h2 className="landing-h2">
            Go live in one tag, or own every layer.
          </h2>
        </div>
        <div className="deployment-choices">
          <article className="deployment-choice deployment-choice-primary">
            <div className="deployment-choice-body">
              <p className="deployment-label">Hosted</p>
              <p className="deployment-headline">Paste a tag, go live.</p>
              <p className="deployment-summary">
                No database, no deploy. We run the backend.
              </p>
            </div>
            <Link className="deployment-choice-action" href="/login">
              Get your snippet
            </Link>
          </article>

          <article className="deployment-choice">
            <div className="deployment-choice-body">
              <p className="deployment-label">Self-hosted</p>
              <p className="deployment-headline">Every layer, yours.</p>
              <p className="deployment-summary">
                Run your own Supabase, deploy the app yourself. MIT-licensed.
              </p>
            </div>
            <a
              className="deployment-choice-action"
              href="https://github.com/s4tr2/pinmark"
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </article>
        </div>
      </section>

      <section className="landing-section" data-scroll-reveal>
        <h2 className="landing-h2">Reviewers stay anonymous</h2>
        <p style={{ maxWidth: "52ch" }}>
          No reviewer accounts, ever. A guest is a first name and a random
          token in their own browser: no emails, no cookies, no tracking.
          Prefer a closed loop? Switch a project to review-link mode and the
          widget is invisible without your secret link.
        </p>
      </section>

      <footer className="landing-footer" data-scroll-reveal>
        <div className="footer-brand">
          <span className="footer-brand-mark">
            <PinmarkLogo name={BRAND_NAME} />
            <span className="footer-pin" aria-hidden />
          </span>
        </div>
        <nav className="footer-links" aria-label="More">
          <a
            href="https://github.com/s4tr2/pinmark"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <Link href="/docs">Docs</Link>
          <a
            href="https://github.com/s4tr2/pinmark/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
          >
            MIT licensed
          </a>
        </nav>
      </footer>
    </main>
  );
}
