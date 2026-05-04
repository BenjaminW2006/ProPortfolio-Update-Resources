import { Router, type IRouter, type Request, type Response } from "express";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentSettings } from "./settings";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface ResetToken {
  email: string;
  expires: number;
}

const resetTokens = new Map<string, ResetToken>();

function purgeExpired() {
  const now = Date.now();
  for (const [token, data] of resetTokens) {
    if (data.expires < now) resetTokens.delete(token);
  }
}

async function sendResetEmail(to: string, resetLink: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("RESEND_API_KEY not set — skipping password reset email");
    return false;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Admin Password Reset <onboarding@resend.dev>",
      to,
      subject: "Admin Password Reset",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="margin-bottom:8px">Reset your admin password</h2>
          <p style="color:#555;margin-bottom:24px">
            Click the button below to set a new admin password.
            This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetLink}"
            style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">
            Reset Password
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    if (error) {
      logger.error({ err: error }, "Resend email error");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "Failed to send reset email");
    return false;
  }
}

router.post("/admin/reset-password/request", async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  try {
    const settings = await getCurrentSettings();
    if (!settings.adminEmail || settings.adminEmail.toLowerCase() !== email.trim().toLowerCase()) {
      res.json({ ok: true });
      return;
    }

    purgeExpired();

    const token = randomBytes(32).toString("hex");
    resetTokens.set(token, { email: email.trim().toLowerCase(), expires: Date.now() + 60 * 60 * 1000 });

    const domains = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost";
    const baseUrl = domains.startsWith("localhost")
      ? `http://${domains}`
      : `https://${domains}`;
    const resetLink = `${baseUrl}/admin/reset-password?token=${token}`;

    const sent = await sendResetEmail(email.trim(), resetLink);
    if (!sent && process.env.NODE_ENV !== "production") {
      logger.warn({ resetLink }, "Email not sent — reset link available in dev logs only");
    } else if (!sent) {
      logger.warn("Email not sent — RESEND_API_KEY may not be configured");
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Error in reset-password/request");
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

router.post("/admin/reset-password/confirm", async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !password) {
    res.status(400).json({ error: "Token and new password are required." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  purgeExpired();

  const entry = resetTokens.get(token);
  if (!entry || entry.expires < Date.now()) {
    resetTokens.delete(token);
    res.status(400).json({ error: "This reset link has expired or is invalid. Please request a new one." });
    return;
  }

  try {
    const settings = await getCurrentSettings();
    const adminPasswordHash = await bcrypt.hash(password, 12);
    const updated = { ...settings, adminPasswordHash };
    const dataStr = JSON.stringify(updated);
    await db
      .insert(siteSettingsTable)
      .values({ id: 1, data: dataStr })
      .onConflictDoUpdate({ target: siteSettingsTable.id, set: { data: dataStr, updatedAt: new Date() } });

    resetTokens.delete(token);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Error in reset-password/confirm");
    res.status(500).json({ error: "Failed to update password. Please try again." });
  }
});

export default router;
