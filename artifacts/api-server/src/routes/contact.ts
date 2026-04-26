import { Router, type IRouter } from "express";
import { Resend } from "resend";

const router: IRouter = Router();

router.post("/contact", async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  if (!firstName || !lastName || !email || !phone) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL;

  if (!apiKey || !toEmail) {
    req.log.warn("RESEND_API_KEY or CONTACT_EMAIL not set — skipping email send");
    res.status(200).json({ success: true, note: "Email not configured" });
    return;
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Upstate Palmetto Property Services <onboarding@resend.dev>",
    to: [toEmail],
    replyTo: [email],
    subject: `New Quote Request from ${firstName} ${lastName}`,
    html: `
      <h2>New Quote Request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;">
        <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;width:140px;">Name</td><td style="padding:8px;">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px;font-weight:bold;background:#f0f4f8;">Phone</td><td style="padding:8px;">${phone}</td></tr>
      </table>
      <p style="color:#666;font-size:12px;margin-top:24px;">Sent from the Upstate Palmetto Property Services website contact form.</p>
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
