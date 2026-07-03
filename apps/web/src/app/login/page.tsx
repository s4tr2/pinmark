import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_URL, BRAND_NAME } from "@/lib/config";

async function sendMagicLink(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect("/login?error=Enter+an+email");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${APP_URL}/auth/callback` },
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/login?sent=1");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main>
      <h1>Sign in to {BRAND_NAME}</h1>
      {searchParams.sent ? (
        <p>
          Check your email for a magic link.{" "}
          <span className="muted">
            (Local dev: open Inbucket at http://127.0.0.1:54324)
          </span>
        </p>
      ) : (
        <form action={sendMagicLink}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
          <p>
            <button type="submit">Send magic link</button>
          </p>
        </form>
      )}
      {searchParams.error && (
        <p style={{ color: "var(--danger)" }}>{searchParams.error}</p>
      )}
    </main>
  );
}
