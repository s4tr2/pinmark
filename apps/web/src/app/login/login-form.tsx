"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { sendMagicLink } from "@/lib/actions";

function SubmitButton({ cooldown, sent }: { cooldown: number; sent: boolean }) {
  const { pending } = useFormStatus();
  const label = pending
    ? "Sending…"
    : cooldown > 0
      ? `Resend in ${cooldown}s`
      : sent
        ? "Resend magic link"
        : "Send magic link";
  return (
    <button type="submit" disabled={pending || cooldown > 0}>
      {label}
    </button>
  );
}

export function LoginForm({
  sent,
  error,
}: {
  sent: boolean;
  error?: string;
}) {
  // Supabase rate-limit errors carry the remaining wait ("...after N seconds");
  // a fresh send gets the standard 60s window.
  const rateLimited = error?.match(/after (\d+) seconds/i);
  const [cooldown, setCooldown] = useState(() =>
    rateLimited ? parseInt(rateLimited[1], 10) : sent ? 60 : 0
  );
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(sessionStorage.getItem("pinmark:login-email") ?? "");
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  return (
    <>
      {sent && (
        <p>
          Check your email for a magic link. Didn&apos;t get it? You can resend
          once the timer runs out.
        </p>
      )}
      {error && (
        <p style={{ color: "var(--danger)" }}>
          {rateLimited
            ? "Too many requests. Please wait before resending."
            : error}
        </p>
      )}
      <form action={sendMagicLink}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            sessionStorage.setItem("pinmark:login-email", e.target.value);
          }}
        />
        <p>
          <SubmitButton cooldown={cooldown} sent={sent} />
        </p>
      </form>
    </>
  );
}
