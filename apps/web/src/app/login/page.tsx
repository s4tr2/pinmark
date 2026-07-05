import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BRAND_NAME } from "@/lib/config";
import { ScrollReveal } from "../scroll-reveal";
import { SiteNav } from "../site-nav";
import { LoginForm } from "./login-form";

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
    <main className="product-page auth-page" id="login-page">
      <ScrollReveal rootId="login-page" />
      <SiteNav active="login" />
      <header className="product-page-heading">
        <p className="product-kicker">Welcome back</p>
        <h1>Sign in to {BRAND_NAME}</h1>
      </header>
      <section className="card auth-card" data-scroll-reveal="self">
        <LoginForm sent={!!searchParams.sent} error={searchParams.error} />
      </section>
    </main>
  );
}
