import Link from "next/link";
import type { Metadata } from "next";
import { BRAND_NAME, CDN_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: `Install guide — ${BRAND_NAME}`,
  description:
    "Add Pinmark commenting to prototypes on Lovable, Webflow, Framer, Vercel, Replit, Netlify and any other platform.",
};

const SNIPPET = `<script async src="${CDN_URL}/w.js" data-pinmark="pk_live_YOUR_KEY"></script>`;

function Snippet() {
  return <code className="snippet">{SNIPPET}</code>;
}

const platforms = [
  { id: "nextjs", label: "Next.js / Vercel" },
  { id: "lovable", label: "Lovable" },
  { id: "webflow", label: "Webflow" },
  { id: "framer", label: "Framer" },
  { id: "replit", label: "Replit" },
  { id: "bolt", label: "Bolt / v0" },
  { id: "netlify", label: "Netlify" },
  { id: "html", label: "Plain HTML / anything else" },
  { id: "wix-squarespace", label: "Wix & Squarespace" },
];

export default function DocsPage() {
  return (
    <main>
      <p>
        <Link href="/">← {BRAND_NAME}</Link> ·{" "}
        <Link href="/dashboard">Dashboard</Link>
      </p>
      <h1>Install {BRAND_NAME} on your prototype</h1>

      <h2 id="quickstart">The 3 steps (every platform)</h2>
      <ol>
        <li>
          <Link href="/dashboard">Create a project</Link> and copy your
          snippet — it looks like this:
          <Snippet />
        </li>
        <li>
          Add your prototype&apos;s <strong>domain</strong> to the
          project&apos;s <em>Allowed domains</em> (e.g.{" "}
          <code>myproto.vercel.app</code>). Pasting the full URL is fine —
          we extract the domain. Add <code>localhost</code> too if you test
          locally.
        </li>
        <li>
          Paste the snippet into your prototype&apos;s <code>&lt;head&gt;</code>{" "}
          (platform-specific steps below), publish, and open the page — the
          💬 bubble appears bottom-right. Press <strong>C</strong> to comment,
          or drag to comment on an area.
        </li>
      </ol>

      <p className="row" style={{ flexWrap: "wrap" }}>
        {platforms.map((p) => (
          <a key={p.id} href={`#${p.id}`}>
            {p.label}
          </a>
        ))}
        <a href="#troubleshooting">Troubleshooting</a>
      </p>

      <div className="card" id="nextjs">
        <h2 style={{ marginTop: 0 }}>Next.js / Vercel</h2>
        <p>
          <strong>App Router:</strong> in <code>app/layout.tsx</code>, add the
          script inside <code>&lt;head&gt;</code> (or anywhere in the root
          layout&apos;s JSX):
        </p>
        <code className="snippet">{`<head>
  ${SNIPPET.replace("<script", "<script")}
</head>`}</code>
        <p>
          <strong>Pages Router:</strong> put it in{" "}
          <code>pages/_document.tsx</code> inside <code>&lt;Head&gt;</code>.
        </p>
        <p className="muted">
          Allowed domain: <code>your-app.vercel.app</code> (and your custom
          domain if you have one). Vercel <em>preview</em> deployments get a
          unique subdomain per deploy — add those individually if you want
          commenting on previews.
        </p>
      </div>

      <div className="card" id="lovable">
        <h2 style={{ marginTop: 0 }}>Lovable</h2>
        <p>Two ways — the prompt is usually fastest:</p>
        <ol>
          <li>
            <strong>Ask the AI:</strong> paste this prompt into Lovable chat:
            <code className="snippet">{`Add this script tag to the <head> of index.html and change nothing else:
${SNIPPET}`}</code>
          </li>
          <li>
            <strong>Dev Mode:</strong> open the code view, edit{" "}
            <code>index.html</code>, paste the snippet before{" "}
            <code>&lt;/head&gt;</code>.
          </li>
        </ol>
        <p className="muted">
          Then publish. Allowed domain: your published domain, e.g.{" "}
          <code>your-app.lovable.app</code> — or <code>*.lovable.app</code> to
          cover renames and preview URLs.
        </p>
      </div>

      <div className="card" id="webflow">
        <h2 style={{ marginTop: 0 }}>Webflow</h2>
        <ol>
          <li>
            Open your site&apos;s settings → <strong>Custom Code</strong> tab
          </li>
          <li>
            Paste the snippet into <strong>Head Code</strong>
          </li>
          <li>Save and publish the site</li>
        </ol>
        <p className="muted">
          ⚠️ Webflow only runs custom code on sites with a{" "}
          <strong>paid site plan</strong> — free staging sites
          (<code>*.webflow.io</code>) with no plan won&apos;t inject it. For a
          single page instead, use Page Settings → Custom Code. Allowed
          domain: <code>your-site.webflow.io</code> or your custom domain.
        </p>
      </div>

      <div className="card" id="framer">
        <h2 style={{ marginTop: 0 }}>Framer</h2>
        <ol>
          <li>
            Site Settings → <strong>General</strong> → scroll to{" "}
            <strong>Custom Code</strong>
          </li>
          <li>
            Paste the snippet into{" "}
            <strong>Start of &lt;head&gt; tag</strong>
          </li>
          <li>Publish</li>
        </ol>
        <p className="muted">
          ⚠️ Framer requires a <strong>paid site plan</strong> for custom
          code. Allowed domain: <code>your-site.framer.app</code>,{" "}
          <code>*.framer.website</code>, or your custom domain.
        </p>
      </div>

      <div className="card" id="replit">
        <h2 style={{ marginTop: 0 }}>Replit</h2>
        <ol>
          <li>
            Open the file tree and edit your app&apos;s{" "}
            <code>index.html</code> (for Vite/React templates it&apos;s at the
            project root or in <code>client/</code>)
          </li>
          <li>
            Paste the snippet before <code>&lt;/head&gt;</code>
          </li>
          <li>Redeploy (Deployments tab)</li>
        </ol>
        <p className="muted">
          Allowed domain: <code>your-app.replit.app</code>. You can also ask
          Replit&apos;s AI agent to add the tag for you.
        </p>
      </div>

      <div className="card" id="bolt">
        <h2 style={{ marginTop: 0 }}>Bolt.new / v0</h2>
        <p>
          Ask the AI to add it — same prompt pattern as Lovable:
        </p>
        <code className="snippet">{`Add this script tag to the document <head> and change nothing else:
${SNIPPET}`}</code>
        <p className="muted">
          For v0/Next.js output, it belongs in <code>app/layout.tsx</code>.
          Allowed domain: whatever the platform gives your deployment (check
          the browser address bar after deploying).
        </p>
      </div>

      <div className="card" id="netlify">
        <h2 style={{ marginTop: 0 }}>Netlify</h2>
        <p>
          Either paste the snippet into your site&apos;s HTML like any static
          site, or inject it without touching code: Site configuration →{" "}
          <strong>Build &amp; deploy</strong> → <strong>Post processing</strong>{" "}
          → <strong>Snippet injection</strong> → &quot;Insert before
          &lt;/head&gt;&quot;.
        </p>
        <p className="muted">
          Allowed domain: <code>your-site.netlify.app</code> or your custom
          domain.
        </p>
      </div>

      <div className="card" id="html">
        <h2 style={{ marginTop: 0 }}>Plain HTML / anything else</h2>
        <p>
          Paste the snippet anywhere in your page — before{" "}
          <code>&lt;/head&gt;</code> is conventional, but it works from{" "}
          <code>&lt;body&gt;</code> too. It loads async and never blocks or
          breaks the host page.
        </p>
        <Snippet />
        <p className="muted">
          Works with any framework or hosting: GitHub Pages, Cloudflare Pages,
          Render, S3, your own server. The only requirements are that the page
          is served from a domain on your allowlist and can reach{" "}
          <code>{CDN_URL}</code>.
        </p>
      </div>

      <div className="card" id="wix-squarespace">
        <h2 style={{ marginTop: 0 }}>Wix &amp; Squarespace</h2>
        <p>
          <strong>Wix:</strong> Settings → <strong>Custom Code</strong> → Add
          Custom Code → paste → apply to All Pages, load in Head.
          <br />
          <strong>Squarespace:</strong> Settings → Advanced →{" "}
          <strong>Code Injection</strong> → Header field.
        </p>
        <p className="muted">
          ⚠️ Both require paid plans for custom code (Wix: Premium;
          Squarespace: Business or higher).
        </p>
      </div>

      <div className="card" id="troubleshooting">
        <h2 style={{ marginTop: 0 }}>Troubleshooting</h2>
        <p>
          <strong>No bubble appears?</strong> Open the browser console
          (F12) and look for a <code>[pinmark]</code> line — it states the
          exact reason:
        </p>
        <ul>
          <li>
            <em>&quot;domain … is not in the project&apos;s allowed
            domains&quot;</em> — add the page&apos;s domain in the dashboard
            (project → Allowed domains) and reload.
          </li>
          <li>
            <em>&quot;the data-pinmark key doesn&apos;t match any
            project&quot;</em> — re-copy the snippet from the dashboard; the
            key may have been regenerated.
          </li>
          <li>
            <strong>No console line at all</strong> — the script isn&apos;t on
            the page: view page source and search for <code>w.js</code>. If
            missing, the platform didn&apos;t inject it (check paid-plan
            requirements above, and that you published after adding it).
          </li>
          <li>
            <strong>Project is in &quot;Review link only&quot; mode</strong> —
            the widget is deliberately invisible without the secret link.
            Open your review link once in that browser, or switch the project
            to Open.
          </li>
        </ul>
        <p>
          <strong>Pins in slightly wrong places after resizing?</strong> Pins
          dropped on empty background have no element to attach to and fall
          back to page-relative positioning (shown at 60% opacity). Pin on
          concrete elements — buttons, cards, headings — for positions that
          survive any viewport.
        </p>
        <p>
          <strong>Widget cache:</strong> <code>w.js</code> is cached for 5
          minutes — after changing project settings, a hard reload
          (Cmd/Ctrl+Shift+R) picks things up immediately.
        </p>
      </div>

      <p className="muted">
        Something not covered? The console <code>[pinmark]</code> message plus
        your platform name is everything needed to debug.
      </p>
    </main>
  );
}
