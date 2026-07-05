import Link from "next/link";
import type { Metadata } from "next";
import { BRAND_NAME, CDN_URL } from "@/lib/config";
import { CopyPrompt } from "./copy-prompt";
import { DocsReveal } from "./docs-reveal";
import { SiteNav } from "../site-nav";

export const metadata: Metadata = {
  title: `Install guide · ${BRAND_NAME}`,
  description:
    "Add Pinmark commenting to prototypes on Lovable, Webflow, Framer, Vercel, Replit, Netlify and any other platform.",
};

const SNIPPET = `<script async src="${CDN_URL}/w.js" data-pinmark="pk_live_YOUR_KEY"></script>`;

const VERCEL_PROMPT = `Install Pinmark in this project so it loads on every page.

1. Detect how this app manages its document <head>.
2. For Next.js App Router, add the script in app/layout.tsx. For Pages Router, add it in pages/_document.tsx. For another framework, use its shared document or root layout.
3. Add the script exactly once and keep async and data-pinmark unchanged.
4. Do not change unrelated code.

Use this script:
${SNIPPET}

Afterward, tell me which file you changed.`;

const HTML_PROMPT = `Install Pinmark on every page of this site.

Add the script below exactly once to the shared document <head>, immediately before </head>. If the site uses templates or layouts, choose the root layout that renders every page. Keep async and data-pinmark unchanged, and do not change unrelated code.

${SNIPPET}

Afterward, tell me which file you changed.`;

function Snippet({ children }: { children?: string }) {
  return <code className="snippet">{children ?? SNIPPET}</code>;
}

function PaidPlanTag({ note }: { note: string }) {
  return <span className="tag">{note}</span>;
}

type Guide = {
  id: string;
  label: string;
  eyebrow: string;
  domains?: readonly string[];
  glyph?: string;
};

const GUIDES = {
  nextjs: {
    id: "nextjs",
    label: "Next.js / Vercel",
    eyebrow: "Framework + hosting",
    domains: ["nextjs.org", "vercel.com"],
  },
  lovable: {
    id: "lovable",
    label: "Lovable",
    eyebrow: "AI app builder",
    domains: ["lovable.dev"],
  },
  webflow: {
    id: "webflow",
    label: "Webflow",
    eyebrow: "Site builder",
    domains: ["webflow.com"],
  },
  framer: {
    id: "framer",
    label: "Framer",
    eyebrow: "Site builder",
    domains: ["framer.com"],
  },
  replit: {
    id: "replit",
    label: "Replit",
    eyebrow: "Cloud IDE",
    domains: ["replit.com"],
  },
  bolt: {
    id: "bolt",
    label: "Bolt / v0",
    eyebrow: "AI app builders",
    domains: ["bolt.new", "v0.dev"],
  },
  netlify: {
    id: "netlify",
    label: "Netlify",
    eyebrow: "Hosting",
    domains: ["netlify.com"],
  },
  html: {
    id: "html",
    label: "Plain HTML",
    eyebrow: "Universal install",
    glyph: "</>",
  },
  wixSquarespace: {
    id: "wix-squarespace",
    label: "Wix / Squarespace",
    eyebrow: "Site builders",
    domains: ["wix.com", "squarespace.com"],
  },
  troubleshooting: {
    id: "troubleshooting",
    label: "Troubleshooting",
    eyebrow: "Quick diagnostics",
    glyph: "?",
  },
} as const satisfies Record<string, Guide>;

const guides = Object.values(GUIDES);

function GuideLogo({ guide }: { guide: Guide }) {
  return (
    <span
      className={`guide-logo${guide.domains?.length === 2 ? " guide-logo-pair" : ""}`}
      aria-hidden="true"
    >
      {guide.domains?.map((domain) => (
        <img
          key={domain}
          src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
          alt=""
          width={22}
          height={22}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ))}
      {guide.glyph && <span className="guide-logo-glyph">{guide.glyph}</span>}
    </span>
  );
}

function GuideHeader({
  guide,
  note,
}: {
  guide: Guide;
  note?: string;
}) {
  return (
    <header className="doc-section-header">
      <GuideLogo guide={guide} />
      <div>
        <p className="doc-section-eyebrow">{guide.eyebrow}</p>
        <div className="doc-section-title">
          <h2>{guide.label}</h2>
          {note && <PaidPlanTag note={note} />}
        </div>
      </div>
    </header>
  );
}

export default function DocsPage() {
  return (
    <main className="docs" id="install-guide">
      <DocsReveal />

      <SiteNav active="docs" />

      <header className="docs-hero" data-doc-reveal>
        <p className="docs-kicker">One script. Any prototype.</p>
        <h1>Install {BRAND_NAME} on your prototype</h1>
        <p className="muted">
          The setup is always the same. Choose your platform to see exactly
          where the snippet belongs.
        </p>
      </header>

      <ol className="docs-steps" data-doc-reveal>
        <li>
          <span className="docs-step-number">01</span>
          <div>
            <strong>Create a project.</strong>{" "}
            <Link href="/dashboard">Open the dashboard</Link> and copy your
            snippet.
            <Snippet />
          </div>
        </li>
        <li>
          <span className="docs-step-number">02</span>
          <div>
            <strong>Allow the domain.</strong> Add your prototype&apos;s
            domain (for example <code>myproto.vercel.app</code>) to{" "}
            <em>Allowed domains</em>. Include <code>localhost</code> for local
            testing.
          </div>
        </li>
        <li>
          <span className="docs-step-number">03</span>
          <div>
            <strong>Paste and publish.</strong> Add the snippet to the{" "}
            <code>&lt;head&gt;</code>. The comment bubble appears
            bottom-right; press <kbd>C</kbd> or drag to comment on an area.
          </div>
        </li>
      </ol>

      <nav
        className="guide-index"
        id="platform-guides"
        aria-labelledby="guide-index-title"
        data-doc-reveal
      >
        <div className="guide-index-heading">
          <div>
            <p className="docs-kicker">Platform guides</p>
            <h2 id="guide-index-title">Choose where you&apos;re building</h2>
          </div>
          <span>{guides.length} guides</span>
        </div>
        <ul className="guide-index-grid">
          {guides.map((guide) => (
            <li key={guide.id}>
              <a className="guide-index-link" href={`#${guide.id}`}>
                <GuideLogo guide={guide} />
                <span>
                  <strong>{guide.label}</strong>
                  <small>{guide.eyebrow}</small>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section className="doc-section" id="nextjs" data-doc-reveal>
        <GuideHeader guide={GUIDES.nextjs} />
        <p>
          Using an AI code assistant? Give it the project-aware prompt below:
        </p>
        <CopyPrompt label="Prompt for your coding agent" prompt={VERCEL_PROMPT} />
        <p>
          <strong>App Router:</strong> in <code>app/layout.tsx</code>, add
          the script inside <code>&lt;head&gt;</code>:
        </p>
        <Snippet>{`<head>\n  ${SNIPPET}\n</head>`}</Snippet>
        <p>
          <strong>Pages Router:</strong> add it inside{" "}
          <code>&lt;Head&gt;</code> in <code>pages/_document.tsx</code>.
        </p>
        <p className="muted">
          Allowed domain: <code>your-app.vercel.app</code> plus any custom
          domain. Preview deployments get a unique subdomain per deploy; add
          those individually if you review previews.
        </p>
      </section>

      <section className="doc-section" id="lovable" data-doc-reveal>
        <GuideHeader guide={GUIDES.lovable} />
        <p>Fastest path is asking the AI:</p>
        <Snippet>{`Add this script tag to the <head> of index.html and change nothing else:\n${SNIPPET}`}</Snippet>
        <p>
          Or in Dev Mode, edit <code>index.html</code> yourself and paste
          before <code>&lt;/head&gt;</code>. Then publish.
        </p>
        <p className="muted">
          Allowed domain: <code>your-app.lovable.app</code>, or{" "}
          <code>*.lovable.app</code> to cover renames and previews.
        </p>
      </section>

      <section className="doc-section" id="webflow" data-doc-reveal>
        <GuideHeader
          guide={GUIDES.webflow}
          note="paid site plan required"
        />
        <ol>
          <li>
            Site settings → <strong>Custom Code</strong>
          </li>
          <li>
            Paste the snippet into <strong>Head Code</strong>
          </li>
          <li>Save, then publish the site</li>
        </ol>
        <p className="muted">
          Custom code only runs on sites with a paid plan; free{" "}
          <code>*.webflow.io</code> staging sites won&apos;t inject it. For a
          single page, use Page Settings → Custom Code instead. Allowed
          domain: <code>your-site.webflow.io</code> or your custom domain.
        </p>
      </section>

      <section className="doc-section" id="framer" data-doc-reveal>
        <GuideHeader guide={GUIDES.framer} note="paid site plan required" />
        <ol>
          <li>
            Site Settings → <strong>General</strong> →{" "}
            <strong>Custom Code</strong>
          </li>
          <li>
            Paste into <strong>Start of &lt;head&gt; tag</strong>
          </li>
          <li>Publish</li>
        </ol>
        <p className="muted">
          Allowed domain: <code>your-site.framer.app</code>,{" "}
          <code>*.framer.website</code>, or your custom domain.
        </p>
      </section>

      <section className="doc-section" id="replit" data-doc-reveal>
        <GuideHeader guide={GUIDES.replit} />
        <ol>
          <li>
            Edit your app&apos;s <code>index.html</code> (project root, or{" "}
            <code>client/</code> in full-stack templates)
          </li>
          <li>
            Paste before <code>&lt;/head&gt;</code>
          </li>
          <li>Redeploy from the Deployments tab</li>
        </ol>
        <p className="muted">
          Allowed domain: <code>your-app.replit.app</code>. Replit&apos;s AI
          agent can also add the tag for you.
        </p>
      </section>

      <section className="doc-section" id="bolt" data-doc-reveal>
        <GuideHeader guide={GUIDES.bolt} />
        <p>Same prompt pattern as Lovable:</p>
        <Snippet>{`Add this script tag to the document <head> and change nothing else:\n${SNIPPET}`}</Snippet>
        <p className="muted">
          For v0&apos;s Next.js output it belongs in{" "}
          <code>app/layout.tsx</code>. Allowed domain: whatever your
          deployment&apos;s address bar shows.
        </p>
      </section>

      <section className="doc-section" id="netlify" data-doc-reveal>
        <GuideHeader guide={GUIDES.netlify} />
        <p>
          Paste into your site&apos;s HTML like any static site, or inject
          without touching code: Site configuration →{" "}
          <strong>Build &amp; deploy</strong> →{" "}
          <strong>Post processing</strong> → <strong>Snippet injection</strong>{" "}
          → &quot;Insert before &lt;/head&gt;&quot;.
        </p>
        <p className="muted">
          Allowed domain: <code>your-site.netlify.app</code> or your custom
          domain.
        </p>
      </section>

      <section className="doc-section" id="html" data-doc-reveal>
        <GuideHeader guide={GUIDES.html} />
        <p>
          For a custom-coded site, this prompt finds the shared document and
          installs Pinmark once:
        </p>
        <CopyPrompt label="Prompt for your coding agent" prompt={HTML_PROMPT} />
        <p>
          Paste anywhere in the page, before <code>&lt;/head&gt;</code> by
          convention. It loads async and never blocks or breaks the host page.
        </p>
        <Snippet />
        <p className="muted">
          Works on GitHub Pages, Cloudflare Pages, Render, S3, your own
          server, any framework. The only requirements: the page&apos;s
          domain is on your allowlist and can reach <code>{CDN_URL}</code>.
        </p>
      </section>

      <section className="doc-section" id="wix-squarespace" data-doc-reveal>
        <GuideHeader
          guide={GUIDES.wixSquarespace}
          note="paid plans required"
        />
        <p>
          <strong>Wix:</strong> Settings → <strong>Custom Code</strong> →
          Add Custom Code → apply to All Pages, load in Head.
        </p>
        <p>
          <strong>Squarespace:</strong> Settings → Advanced →{" "}
          <strong>Code Injection</strong> → Header field.
        </p>
        <p className="muted">
          Wix needs Premium; Squarespace needs Business or higher.
        </p>
      </section>

      <section className="doc-section" id="self-hosting" data-doc-reveal>
        <GuideHeader
          guide={{
            id: "self-hosting",
            label: "Self-hosting",
            eyebrow: "Own every layer",
            glyph: "OSS",
          }}
        />
        <p>
          Pinmark is open source under the{" "}
          <a
            href="https://github.com/s4tr2/pinmark/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
          >
            MIT license
          </a>
          .
        </p>
        <p className="muted">
          Running your own instance means bringing your own Supabase project
          (cloud free tier, or{" "}
          <a
            href="https://supabase.com/docs/guides/self-hosting"
            target="_blank"
            rel="noreferrer"
          >
            self-hosted Supabase
          </a>
          ) and deploying <code>apps/web</code> anywhere Node runs. Full steps
          — env vars, auth redirect URLs, a smoke test — are in{" "}
          <a
            href="https://github.com/s4tr2/pinmark/blob/main/DEPLOY.md"
            target="_blank"
            rel="noreferrer"
          >
            DEPLOY.md
          </a>
          .
        </p>
      </section>

      <section className="doc-section" id="troubleshooting" data-doc-reveal>
        <GuideHeader guide={GUIDES.troubleshooting} />
        <p>
          <strong>No bubble?</strong> Open the browser console and find the{" "}
          <code>[pinmark]</code> line; it names the exact problem:
        </p>
        <ul>
          <li>
            <em>domain not in allowed domains</em>: add the page&apos;s
            domain in the dashboard and reload.
          </li>
          <li>
            <em>key doesn&apos;t match any project</em>: re-copy the snippet;
            the key may have been regenerated.
          </li>
          <li>
            No <code>[pinmark]</code> line at all: the script isn&apos;t on
            the page. View source and search for <code>w.js</code>; if
            missing, the platform didn&apos;t inject it (check paid-plan
            requirements above, and that you published after adding it).
          </li>
          <li>
            Project in <em>review link only</em> mode: the widget is
            deliberately invisible without the secret link. Open your review
            link once in that browser, or switch the project to Open.
          </li>
        </ul>
        <p>
          <strong>Pins shift after resizing?</strong> Pins dropped on empty
          background have nothing to attach to and fall back to page-relative
          position (shown at 60% opacity). Pin on concrete elements, buttons,
          cards, headings, for positions that survive any viewport.
        </p>
        <p>
          <strong>Stale behavior after changing settings?</strong>{" "}
          <code>w.js</code> is cached for five minutes; hard reload
          (<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>) picks changes up
          immediately.
        </p>
      </section>
    </main>
  );
}
