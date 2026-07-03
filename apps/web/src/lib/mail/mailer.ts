// Mailer abstraction (PRD §8): Resend for the hosted instance, SMTP for
// self-hosters, selected by MAILER env var. Missing config = mail disabled
// (notifications silently skip; Slack still works).

export interface Mailer {
  send(to: string, subject: string, text: string): Promise<void>;
}

class ResendMailer implements Mailer {
  constructor(private apiKey: string) {}

  async send(to: string, subject: string, text: string): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL,
        to,
        subject,
        text,
      }),
    });
    if (!res.ok) throw new Error(`resend_failed_${res.status}`);
  }
}

class SmtpMailer implements Mailer {
  constructor(private smtpUrl: string) {}

  async send(to: string, subject: string, text: string): Promise<void> {
    // Lazy import so hosted deployments (Resend) never load nodemailer
    const { createTransport } = await import("nodemailer");
    const transport = createTransport(this.smtpUrl);
    await transport.sendMail({
      from: process.env.NOTIFY_FROM_EMAIL,
      to,
      subject,
      text,
    });
  }
}

export function getMailer(): Mailer | null {
  const kind = process.env.MAILER;
  if (kind === "resend" && process.env.RESEND_API_KEY)
    return new ResendMailer(process.env.RESEND_API_KEY);
  if (kind === "smtp" && process.env.SMTP_URL)
    return new SmtpMailer(process.env.SMTP_URL);
  return null;
}
