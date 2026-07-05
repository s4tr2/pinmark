import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "@/lib/actions";
import { ScrollReveal } from "../scroll-reveal";
import { SiteNav } from "../site-nav";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, public_key, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="product-page" id="dashboard-page">
      <ScrollReveal rootId="dashboard-page" />
      <SiteNav active="dashboard" signedIn />
      <header className="product-page-heading">
        <p className="product-kicker">Workspace</p>
        <h1>Projects</h1>
        <p className="muted">{user.email}</p>
      </header>

      {searchParams.error && (
        <p style={{ color: "var(--danger)" }}>{searchParams.error}</p>
      )}

      <section className="card" data-scroll-reveal="self">
        <h2>New project</h2>
        <form action={createProject}>
          <label htmlFor="name">Project name</label>
          <input id="name" name="name" required placeholder="My prototype" />
          <label htmlFor="domains">
            Allowed domains (comma or newline separated)
          </label>
          <input
            id="domains"
            name="domains"
            placeholder="myproto.vercel.app, *.lovable.app, localhost"
          />
          <p>
            <button type="submit">Create project</button>
          </p>
        </form>
      </section>

      <section className="product-project-list" data-scroll-reveal>
        {(projects ?? []).map((p) => (
          <article className="card product-project-card" key={p.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Link href={`/p/${p.id}`}>
                <strong>{p.name}</strong>
              </Link>
              <span className="muted">{p.public_key}</span>
            </div>
          </article>
        ))}

        {(projects ?? []).length === 0 && (
          <div className="card product-empty-state">
            <strong>No projects yet.</strong>
            <p className="muted">Create one above to get your first snippet.</p>
          </div>
        )}
      </section>
    </main>
  );
}
