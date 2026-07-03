import { createAdminClient } from "@/lib/supabase/admin";
import { getMailer } from "@/lib/mail/mailer";
import { APP_URL, BRAND_NAME } from "@/lib/config";

const EMAIL_BATCH_WINDOW_MS = 10 * 60 * 1000; // max 1 email per project / 10 min

/**
 * Fires notifications for a new top-level comment (PRD §8). Never throws:
 * notification failure must not fail the comment POST.
 */
export async function notifyNewComment(
  projectId: string,
  authorName: string,
  route: string,
  body: string
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, owner_id, notify_email")
      .eq("id", projectId)
      .single();
    if (!project) return;

    const dashboardLink = `${APP_URL}/p/${project.id}`;

    // Email: batched via notification_log
    // (Slack integration cut from v1 — the dormant slack_webhook_url column
    // remains in the schema for a future opt-in feature.)
    const mailer = getMailer();
    if (!mailer || !project.notify_email) return;

    const { data: log } = await supabase
      .from("notification_log")
      .select("last_email_at")
      .eq("project_id", project.id)
      .single();

    if (
      log &&
      Date.now() - new Date(log.last_email_at).getTime() < EMAIL_BATCH_WINDOW_MS
    )
      return; // batched: an email already went out recently

    const { data: owner } = await supabase.auth.admin.getUserById(
      project.owner_id
    );
    const to = owner?.user?.email;
    if (!to) return;

    await supabase
      .from("notification_log")
      .upsert({ project_id: project.id, last_email_at: new Date().toISOString() });

    await mailer.send(
      to,
      `New comment on ${project.name}`,
      `${authorName} commented on ${route}:\n\n"${body.slice(0, 300)}"\n\n` +
        `View and reply: ${dashboardLink}\n\n— ${BRAND_NAME}`
    );
  } catch (e) {
    console.warn("[pinmark] notification failed:", (e as Error).message);
  }
}
