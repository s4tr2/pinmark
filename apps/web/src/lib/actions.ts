"use server";

import { customAlphabet } from "nanoid";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/config";
import { parseDomains } from "@/lib/domains";

export async function sendMagicLink(formData: FormData) {
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

const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  24
);

export async function createProject(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/dashboard?error=Project+name+required");

  const domains = parseDomains(String(formData.get("domains") ?? ""));

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      name,
      public_key: `pk_live_${nanoid()}`,
      allowed_domains: domains,
    })
    .select("id")
    .single();

  if (error) redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  redirect(`/p/${data.id}`);
}

export async function updateDomains(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const domains = parseDomains(String(formData.get("domains") ?? ""));

  // RLS restricts the update to the owner's own projects
  const { error } = await supabase
    .from("projects")
    .update({ allowed_domains: domains })
    .eq("id", id);

  if (error) redirect(`/p/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/p/${id}`);
  redirect(`/p/${id}?saved=1`);
}

export async function updateAccessMode(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const mode = String(formData.get("access_mode"));
  if (mode !== "open" && mode !== "review_link") {
    redirect(`/p/${id}?error=Invalid+access+mode`);
  }

  const { error } = await supabase
    .from("projects")
    .update({ access_mode: mode })
    .eq("id", id);

  if (error) redirect(`/p/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/p/${id}`);
  redirect(`/p/${id}?saved=1`);
}

export async function regenerateReviewToken(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("projects")
    .update({ review_token: `rt_${nanoid()}` })
    .eq("id", id);

  if (error) redirect(`/p/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/p/${id}`);
  redirect(`/p/${id}?saved=1`);
}

export async function deleteProject(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) redirect(`/p/${id}?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function regeneratePublicKey(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("projects")
    .update({ public_key: `pk_live_${nanoid()}` })
    .eq("id", id);

  if (error) redirect(`/p/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/p/${id}`);
  redirect(`/p/${id}?saved=1`);
}

export async function resolveThread(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("comment_id"));
  const projectId = String(formData.get("project_id"));
  const resolved = String(formData.get("resolved")) === "true";

  // RLS restricts to comments on the owner's own projects
  const { error } = await supabase
    .from("comments")
    .update({ resolved })
    .eq("id", id);

  if (error)
    redirect(`/p/${projectId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/p/${projectId}`);
}

export async function resolveAllThreads(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const projectId = String(formData.get("project_id"));

  // RLS restricts to the owner's own project; top-level pins only
  const { error } = await supabase
    .from("comments")
    .update({ resolved: true })
    .eq("project_id", projectId)
    .is("parent_id", null)
    .eq("resolved", false);

  if (error)
    redirect(`/p/${projectId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/p/${projectId}`);
}

export async function deleteComment(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("comment_id"));
  const projectId = String(formData.get("project_id"));

  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error)
    redirect(`/p/${projectId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/p/${projectId}`);
}

export async function replyAsOwner(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const projectId = String(formData.get("project_id"));
  const parentId = String(formData.get("parent_id"));
  const route = String(formData.get("route"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/p/${projectId}?error=Reply+can%27t+be+empty`);

  const { error } = await supabase.from("comments").insert({
    project_id: projectId,
    parent_id: parentId,
    route,
    anchor: null,
    author_name: user.email?.split("@")[0] ?? "Author",
    author_token: crypto.randomUUID(),
    body,
  });

  if (error)
    redirect(`/p/${projectId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/p/${projectId}`);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
