import type { Metadata } from "next";
import Script from "next/script";
import { BRAND_NAME, CDN_URL, SELF_HOSTED } from "@/lib/config";
import { SiteNav } from "../site-nav";

const DEMO_KEY = process.env.NEXT_PUBLIC_DEMO_KEY;
const SHOW_DEMO = Boolean(DEMO_KEY) && !SELF_HOSTED;

export const metadata: Metadata = {
  title: `Playground · ${BRAND_NAME}`,
  description: "Try pinning feedback directly onto a live prototype.",
};

export default function PlaygroundPage() {
  return (
    <main className="playground">
      <SiteNav active="playground" />

      <section className="playground-intro">
        <div>
          <p className="playground-kicker">Live playground</p>
          <h1>
            Pin something.
            <br />
            See how it feels.
          </h1>
          <p>
            This is a disposable prototype surface. Leave feedback on a word,
            a card, or an entire area.
          </p>
        </div>
        <div className="playground-instruction">
          <span className="playground-live-dot" aria-hidden />
          <span>
            <strong>Press <kbd>C</kbd></strong>
            <small>Then click or drag anywhere below.</small>
          </span>
        </div>
      </section>

      {SHOW_DEMO ? (
        <>
          <section className="playground-surface" aria-label="Demo prototype">
            <header className="playground-window-bar">
              <span className="playground-window-dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span>aurora.co</span>
              <span className="playground-draft">Draft</span>
            </header>

            <div className="playground-marketing">
              <header className="playground-marketing-nav">
                <strong>Aurora</strong>
                <nav aria-hidden>
                  <span>Product</span>
                  <span>Pricing</span>
                  <span>Changelog</span>
                </nav>
                <span className="playground-prototype-action">
                  Start free trial
                </span>
              </header>

              <div className="playground-marketing-hero">
                <p className="playground-mini-label">Aurora 2.0</p>
                <h2>Focus is a feature.</h2>
                <p className="playground-lede">
                  Aurora blocks distractions before they start, so deep work
                  happens by default.
                </p>
              </div>

              <div className="playground-marketing-features">
                <article>
                  <h3>Focus sessions</h3>
                  <p>Timed blocks that silence everything else.</p>
                </article>
                <article>
                  <h3>Smart blocks</h3>
                  <p>Learns which apps break your flow, and mutes them.</p>
                </article>
                <article>
                  <h3>Weekly reports</h3>
                  <p>See where your attention actually went.</p>
                </article>
              </div>

              <blockquote className="playground-marketing-quote">
                <p>
                  &ldquo;I get four uninterrupted hours a day now. That never
                  happened before.&rdquo;
                </p>
                <cite>Priya, product designer</cite>
              </blockquote>
            </div>
          </section>

          <p className="playground-note" id="playground-note">
            Shared public playground. Please don&apos;t post sensitive
            information.
          </p>
        </>
      ) : SELF_HOSTED ? (
        <div className="playground-unavailable">
          <strong>The playground is not part of self-hosted instances.</strong>
          <span>
            It exists to demo the hosted product. Install the widget on your
            own prototype instead. See /docs.
          </span>
        </div>
      ) : (
        <div className="playground-unavailable">
          <strong>The playground is not connected yet.</strong>
          <span>
            Add <code>NEXT_PUBLIC_DEMO_KEY</code> to enable the live widget.
          </span>
        </div>
      )}

      {SHOW_DEMO && (
        <Script
          src={`${CDN_URL}/w.js`}
          data-pinmark={DEMO_KEY}
          strategy="afterInteractive"
        />
      )}
    </main>
  );
}
