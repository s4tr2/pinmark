import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProject, signOut } from "@/lib/actions";
import { BRAND_NAME } from "@/lib/config";

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
    <main>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>{BRAND_NAME} — Projects</h1>
        <form action={signOut}>
          <button className="secondary" type="submit">
            Sign out
          </button>
        </form>
      </div>
      <p className="muted">{user.email}</p>

      {searchParams.error && (
        <p style={{ color: "var(--danger)" }}>{searchParams.error}</p>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.125rem" }}>New project</h2>
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
      </div>

      {(projects ?? []).map((p) => (
        <div className="card" key={p.id}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <Link href={`/p/${p.id}`}>
              <strong>{p.name}</strong>
            </Link>
            <span className="muted">{p.public_key}</span>
          </div>
        </div>
      ))}

      {(projects ?? []).length === 0 && (
        <p className="muted">No projects yet — create one above.</p>
      )}
    </main>
  );
}
