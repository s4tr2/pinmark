import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteComment,
  deleteProject,
  regeneratePublicKey,
  regenerateReviewToken,
  replyAsOwner,
  resolveAllThreads,
  resolveThread,
  updateAccessMode,
  updateDomains,
} from "@/lib/actions";
import { snippetFor } from "@/lib/config";
import { CopyButton } from "./copy-button";

function ReviewLink({
  domains,
  token,
  projectId,
}: {
  domains: string[];
  token: string;
  projectId: string;
}) {
  const domain =
    domains.find((d) => !d.startsWith("*") && d !== "localhost") ??
    "your-prototype.example";
  const link = `https://${domain}/#pinmark=${token}`;

  return (
    <>
      <p className="muted">
        Share this review link — anyone who opens it once can see pins and
        comment in that browser:
      </p>
      <code className="snippet">{link}</code>
      <p className="row">
        <CopyButton text={link} />
        <form action={regenerateReviewToken}>
          <input type="hidden" name="id" value={projectId} />
          <button className="secondary" type="submit">
            Regenerate (revokes all shared links)
          </button>
        </form>
      </p>
    </>
  );
}

type ThreadComment = {
  id: string;
  parent_id: string | null;
  route: string;
  author_name: string;
  body: string;
  resolved: boolean;
  created_at: string;
};

function Threads({
  comments,
  projectId,
  filter,
}: {
  comments: ThreadComment[];
  projectId: string;
  filter: "open" | "resolved";
}) {
  const pins = comments.filter(
    (c) => !c.parent_id && (filter === "resolved") === c.resolved
  );
  const byRoute = new Map<string, ThreadComment[]>();
  for (const p of pins) {
    byRoute.set(p.route, [...(byRoute.get(p.route) ?? []), p]);
  }

  if (pins.length === 0)
    return <p className="muted">No {filter} threads.</p>;

  return (
    <>
      {[...byRoute.entries()].map(([route, routePins]) => (
        <div key={route}>
          <h3 style={{ fontSize: "0.875rem", margin: "16px 0 4px" }}>
            <code>{route}</code>
          </h3>
          {routePins.map((pin) => (
            <div className="card" key={pin.id} style={{ margin: "8px 0" }}>
              <p style={{ margin: "0 0 4px" }}>
                <strong>{pin.author_name}</strong>{" "}
                <span className="muted">
                  {new Date(pin.created_at).toLocaleString()}
                </span>
              </p>
              <p style={{ margin: "0 0 8px", whiteSpace: "pre-wrap" }}>
                {pin.body}
              </p>
              {comments
                .filter((c) => c.parent_id === pin.id)
                .map((reply) => (
                  <div
                    key={reply.id}
                    style={{
                      borderLeft: "2px solid var(--border)",
                      paddingLeft: 12,
                      margin: "8px 0",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>{reply.author_name}</strong>{" "}
                      <span className="muted">
                        {new Date(reply.created_at).toLocaleString()}
                      </span>
                    </p>
                    <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>
                      {reply.body}
                    </p>
                    <form action={deleteComment} style={{ display: "inline" }}>
                      <input type="hidden" name="comment_id" value={reply.id} />
                      <input type="hidden" name="project_id" value={projectId} />
                      <button
                        className="secondary"
                        style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                ))}
              <div className="row" style={{ marginTop: 8 }}>
                <form action={resolveThread}>
                  <input type="hidden" name="comment_id" value={pin.id} />
                  <input type="hidden" name="project_id" value={projectId} />
                  <input
                    type="hidden"
                    name="resolved"
                    value={pin.resolved ? "false" : "true"}
                  />
                  <button className="secondary" style={{ fontSize: "0.8125rem" }}>
                    {pin.resolved ? "Reopen" : "Resolve"}
                  </button>
                </form>
                <form action={deleteComment}>
                  <input type="hidden" name="comment_id" value={pin.id} />
                  <input type="hidden" name="project_id" value={projectId} />
                  <button
                    className="secondary"
                    style={{ fontSize: "0.8125rem", color: "var(--danger)" }}
                  >
                    Delete thread
                  </button>
                </form>
              </div>
              <form action={replyAsOwner} className="row" style={{ marginTop: 8 }}>
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="parent_id" value={pin.id} />
                <input type="hidden" name="route" value={pin.route} />
                <input name="body" placeholder="Reply…" style={{ flex: 1 }} />
                <button type="submit" style={{ fontSize: "0.8125rem" }}>
                  Reply
                </button>
              </form>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; saved?: string; filter?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, public_key, allowed_domains, access_mode, review_token, created_at"
    )
    .eq("id", params.id)
    .single();

  if (!project) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, parent_id, route, author_name, body, resolved, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  const filter = searchParams.filter === "resolved" ? "resolved" : "open";
  const snippet = snippetFor(project.public_key);

  return (
    <main>
      <p>
        <Link href="/dashboard">← Projects</Link>
      </p>
      <h1>{project.name}</h1>

      {searchParams.error && (
        <p style={{ color: "var(--danger)" }}>{searchParams.error}</p>
      )}
      {searchParams.saved && <p className="muted">Saved.</p>}

      <div className="card">
        <h2>Install snippet</h2>
        <p className="muted">
          Paste into your prototype&apos;s <code>&lt;head&gt;</code> or
          layout, then redeploy. Platform-specific steps (Lovable, Webflow,
          Framer, …): <Link href="/docs">install guide</Link>.
        </p>
        <code className="snippet">{snippet}</code>
        <p className="row">
          <CopyButton text={snippet} />
          <form action={regeneratePublicKey}>
            <input type="hidden" name="id" value={project.id} />
            <button className="secondary" type="submit">
              Regenerate key (kill switch)
            </button>
          </form>
        </p>
        <p className="muted">
          Regenerating the key immediately disables the old snippet everywhere
          it&apos;s embedded — you&apos;ll need to paste the new one into your
          prototype. Comments are kept.
        </p>
      </div>

      <div className="card">
        <h2>Threads</h2>
        <p className="row" style={{ justifyContent: "space-between" }}>
          <span className="row">
            <Link href={`/p/${project.id}?filter=open`}>Open</Link>
            <Link href={`/p/${project.id}?filter=resolved`}>Resolved</Link>
            <span className="muted">·</span>
            <a href={`/api/export/${project.id}?format=md`} className="muted">
              Export .md
            </a>
            <a href={`/api/export/${project.id}?format=docx`} className="muted">
              Export .docx
            </a>
          </span>
          {filter === "open" &&
            (comments ?? []).some((c) => !c.parent_id && !c.resolved) && (
              <form action={resolveAllThreads}>
                <input type="hidden" name="project_id" value={project.id} />
                <button className="secondary" style={{ fontSize: "0.8125rem" }}>
                  Resolve all open threads
                </button>
              </form>
            )}
        </p>
        <Threads
          comments={comments ?? []}
          projectId={project.id}
          filter={filter}
        />
      </div>

      <div className="card">
        <h2>Who can comment</h2>
        <form action={updateAccessMode}>
          <input type="hidden" name="id" value={project.id} />
          <label style={{ margin: "8px 0" }}>
            <input
              type="radio"
              name="access_mode"
              value="open"
              defaultChecked={project.access_mode === "open"}
              style={{ width: "auto", marginRight: 8 }}
            />
            <strong>Open</strong> — anyone with the prototype URL sees pins and
            can comment
          </label>
          <label style={{ margin: "8px 0" }}>
            <input
              type="radio"
              name="access_mode"
              value="review_link"
              defaultChecked={project.access_mode === "review_link"}
              style={{ width: "auto", marginRight: 8 }}
            />
            <strong>Review link only</strong> — the widget is invisible unless
            the visitor opens your secret review link
          </label>
          <p>
            <button type="submit">Save access mode</button>
          </p>
        </form>

        {project.access_mode === "review_link" && (
          <ReviewLink
            domains={project.allowed_domains ?? []}
            token={project.review_token}
            projectId={project.id}
          />
        )}
      </div>

      <div className="card">
        <h2>Allowed domains</h2>
        <p className="muted">
          Comments are only accepted from these origins. Wildcards like{" "}
          <code>*.lovable.app</code> are supported; include{" "}
          <code>localhost</code> for local dev.
        </p>
        <form action={updateDomains}>
          <input type="hidden" name="id" value={project.id} />
          <textarea
            name="domains"
            rows={3}
            defaultValue={(project.allowed_domains ?? []).join("\n")}
            placeholder={"myproto.vercel.app\n*.lovable.app\nlocalhost"}
          />
          <p>
            <button type="submit">Save domains</button>
          </p>
        </form>
      </div>

      <div className="card">
        <h2>Danger zone</h2>
        <p className="muted">
          Deleting a project permanently deletes all of its comments.
        </p>
        <form action={deleteProject}>
          <input type="hidden" name="id" value={project.id} />
          <button
            type="submit"
            style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
          >
            Delete project
          </button>
        </form>
      </div>
    </main>
  );
}
