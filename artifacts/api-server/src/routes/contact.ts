import { Router, type IRouter } from "express";
import { getUncachableResendClient } from "../lib/resend-client";
import { getCurrentSettings } from "./settings";

const router: IRouter = Router();

router.post("/contact", async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  if (!firstName || !lastName || !email || !phone) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }

  let settings;
  try {
    settings = await getCurrentSettings();
  } catch (err) {
    req.log.error({ err }, "Failed to load settings for contact route");
    res.status(500).json({ error: "Server error. Please try again." });
    return;
  }

  const toEmail = settings.email;
  const companyName = settings.companyName;

  let resendClient;
  try {
    resendClient = await getUncachableResendClient();
  } catch (err) {
    req.log.warn({ err }, "Resend not connected — skipping email send");
    res.status(200).json({ success: true, note: "Email not configured" });
    return;
  }

  const { client, fromEmail } = resendClient;

  const { error } = await client.emails.send({
    from: `${companyName} <${fromEmail}>`,
    to: [toEmail],
    replyTo: [email],
    subject: `New Contact Request from ${firstName} ${lastName}`,
    html: `
      <h2>New Contact Request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;">
        <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;width:140px;">Name</td><td style="padding:8px;">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Phone</td><td style="padding:8px;">${phone}</td></tr>
      </table>
      <p style="color:#666;font-size:12px;margin-top:24px;">Sent from the ${companyName} website contact form.</p>
    `,
  });

  if (error) {
    req.log.error({ error }, "Failed to send contact email");
    res.status(500).json({ error: "Failed to send message. Please try again." });
    return;
  }

  res.status(200).json({ success: true });
});

export default router;
