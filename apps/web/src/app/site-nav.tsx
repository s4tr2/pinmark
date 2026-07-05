import Link from "next/link";
import { signOut } from "@/lib/actions";
import { BRAND_NAME, SELF_HOSTED } from "@/lib/config";
import { PinmarkLogo } from "./pinmark-logo";

type NavPage = "home" | "playground" | "docs" | "login" | "dashboard";

function current(active: NavPage, page: NavPage) {
  return active === page ? "page" : undefined;
}

export function SiteNav({
  active,
  signedIn = false,
  className = "",
}: {
  active: NavPage;
  signedIn?: boolean;
  className?: string;
}) {
  return (
    <nav
      className={`site-nav ${className}`.trim()}
      aria-label="Primary navigation"
    >
      <span className="brand-lockup-group">
        <PinmarkLogo name={BRAND_NAME} />
        {SELF_HOSTED && signedIn && (
          <span className="tag nav-self-hosted-tag">Self-hosted</span>
        )}
      </span>
      <div className="nav-actions">
        {!SELF_HOSTED && (
          <Link
            className="nav-link nav-playground"
            href="/playground"
            aria-current={current(active, "playground")}
          >
            Playground
          </Link>
        )}
        {!SELF_HOSTED && (
          <a
            className="nav-link nav-source"
            href="https://github.com/s4tr2/pinmark"
            target="_blank"
            rel="noreferrer"
          >
            Open source
          </a>
        )}
        <Link
          className="nav-link nav-install"
          href="/docs"
          aria-current={current(active, "docs")}
        >
          Install
        </Link>
        {signedIn ? (
          <>
            <Link
              className="nav-link"
              href="/dashboard"
              aria-current={current(active, "dashboard")}
            >
              Projects
            </Link>
            <form action={signOut}>
              <button className="nav-link" type="submit">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link
            className="nav-link"
            href="/login"
            aria-current={current(active, "login")}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
