import Link from "next/link";
import { BRAND_NAME } from "@/lib/config";

export default function LandingPage() {
  return (
    <main>
      <h1>{BRAND_NAME}</h1>
      <p>
        Figma-style commenting for any coded prototype. Paste one script tag
        into a deployed prototype and anyone with the link can pin comments
        directly on the UI — no account, no install.
      </p>
      <p>
        <Link href="/login">Sign in</Link> ·{" "}
        <Link href="/dashboard">Dashboard</Link> ·{" "}
        <Link href="/docs">Install guide</Link>
      </p>
      <p className="muted">Landing page design comes later (PRD §7).</p>
    </main>
  );
}
