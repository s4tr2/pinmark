import Link from "next/link";
import type { Metadata } from "next";
import { BRAND_NAME, CDN_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: `Install guide — ${BRAND_NAME}`,
  description:
    "Add Pinmark commenting to prototypes on Lovable, Webflow, Framer, Vercel, Replit, Netlify and any other platform.",
};

const SNIPPET = `<script async src="${CDN_URL}/w.js" data-pinmark="pk_live_YOUR_KEY"></script>`;

function Snippet({ children }: { children?: string }) {
  return <code className="snippet">{children ?? SNIPPET}</code>;
}

function PaidPlanTag({ note }: { note: string }) {
  return <span className="tag">{note}</span>;
}

const platforms = [
  { id: "nextjs", label: "Next.js / Vercel" },
  { id: "lovable", label: "Lovable" },
  { id: "webflow", label: "Webflow" },
  { id: "framer", label: "Framer" },
  { id: "replit", label: "Replit" },
  { id: "bolt", label: "Bolt / v0" },
  { id: "netlify", label: "Netlify" },
  { id: "html", label: "Plain HTML" },
  { id: "wix-squarespace", label: "Wix / Squarespace" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

export default function DocsPage() {
  return (
    <main>
      <nav className="crumbs">
        <Link href="/">{BRAND_NAME}</Link> / Install guide ·{" "}
        <Link href="/dashboard">Dashboard</Link>
      </nav>

      <h1>Install {BRAND_NAME} on your prototype</h1>
      <p className="muted">
        Three steps on every platform; only where you paste differs.
      </p>

      <ol>
        <li>
          <Link href="/dashboard">Create a project</Link> and copy your
          snippet:
          <Snippet />
        </li>
        <li>
          Add your prototype&apos;s domain (e.g.{" "}
          <code>myproto.vercel.app</code>) to the project&apos;s{" "}
          <em>Allowed domains</em>. Pasting a full URL works, the domain is
          extracted. Include <code>localhost</code> for local testing.
        </li>
        <li>
          Paste the snippet into your prototype&apos;s{" "}
          <code>&lt;head&gt;</code> and publish. The comment bubble appears
          bottom-right; press <kbd>C</kbd> to comment, or drag to comment on
          an area.
        </li>
      </ol>

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        {platforms.map((p, i) => (
          <span key={p.id}>
            {i > 0 && " · "}
            <a href={`#${p.id}`}>{p.label}</a>
          </span>
        ))}
      </p>

      <section className="doc-section" id="nextjs">
        <h2>Next.js / Vercel</h2>
        <p>
          <strong>App Router</strong> — in <code>app/layout.tsx</code>, add
          the script inside <code>&lt;head&gt;</code>:
        </p>
        <Snippet>{`<head>\n  ${SNIPPET}\n</head>`}</Snippet>
        <p>
          <strong>Pages Router</strong> — add it inside{" "}
          <code>&lt;Head&gt;</code> in <code>pages/_document.tsx</code>.
        </p>
        <p className="muted">
          Allowed domain: <code>your-app.vercel.app</code> plus any custom
          domain. Preview deployments get a unique subdomain per deploy; add
          those individually if you review previews.
        </p>
      </section>

      <section className="doc-section" id="lovable">
        <h2>Lovable</h2>
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

      <section className="doc-section" id="webflow">
        <h2>
          Webflow <PaidPlanTag note="paid site plan required" />
        </h2>
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

      <section className="doc-section" id="framer">
        <h2>
          Framer <PaidPlanTag note="paid site plan required" />
        </h2>
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

      <section className="doc-section" id="replit">
        <h2>Replit</h2>
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

      <section className="doc-section" id="bolt">
        <h2>Bolt / v0</h2>
        <p>Same prompt pattern as Lovable:</p>
        <Snippet>{`Add this script tag to the document <head> and change nothing else:\n${SNIPPET}`}</Snippet>
        <p className="muted">
          For v0&apos;s Next.js output it belongs in{" "}
          <code>app/layout.tsx</code>. Allowed domain: whatever your
          deployment&apos;s address bar shows.
        </p>
      </section>

      <section className="doc-section" id="netlify">
        <h2>Netlify</h2>
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

      <section className="doc-section" id="html">
        <h2>Plain HTML / anything else</h2>
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

      <section className="doc-section" id="wix-squarespace">
        <h2>
          Wix / Squarespace <PaidPlanTag note="paid plans required" />
        </h2>
        <p>
          <strong>Wix</strong> — Settings → <strong>Custom Code</strong> →
          Add Custom Code → apply to All Pages, load in Head.
        </p>
        <p>
          <strong>Squarespace</strong> — Settings → Advanced →{" "}
          <strong>Code Injection</strong> → Header field.
        </p>
        <p className="muted">
          Wix needs Premium; Squarespace needs Business or higher.
        </p>
      </section>

      <section className="doc-section" id="troubleshooting">
        <h2>Troubleshooting</h2>
        <p>
          <strong>No bubble?</strong> Open the browser console and find the{" "}
          <code>[pinmark]</code> line; it names the exact problem:
        </p>
        <ul>
          <li>
            <em>domain not in allowed domains</em> — add the page&apos;s
            domain in the dashboard and reload.
          </li>
          <li>
            <em>key doesn&apos;t match any project</em> — re-copy the snippet;
            the key may have been regenerated.
          </li>
          <li>
            No <code>[pinmark]</code> line at all — the script isn&apos;t on
            the page. View source and search for <code>w.js</code>; if
            missing, the platform didn&apos;t inject it (check paid-plan
            requirements above, and that you published after adding it).
          </li>
          <li>
            Project in <em>review link only</em> mode — the widget is
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
