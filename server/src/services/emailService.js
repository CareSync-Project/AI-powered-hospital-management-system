import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

/** Returns true only when both credentials are present */
const isConfigured = () => Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);

/** Lazy-create transporter so missing env vars don't crash startup */
let _transporter = null;
const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
};

/**
 * Send a single email. Silently swallows errors so callers don't crash.
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 */
export const emailService = {
  async send({ to, subject, html, text }) {
    if (!isConfigured()) {
      console.warn('[emailService] Gmail credentials not set — skipping email to:', to);
      return;
    }
    try {
      const info = await getTransporter().sendMail({
        from: `"CareSync Hospital" <${GMAIL_USER}>`,
        to,
        subject,
        text: text || subject,
        html,
      });
      console.log('[emailService] Sent:', info.messageId, '→', to);
    } catch (err) {
      console.error('[emailService] Failed to send to', to, '—', err.message);
    }
  },

  /**
   * Send the same announcement email to multiple recipients in parallel.
   * Caps concurrency to avoid Gmail rate-limit (20 concurrent max).
   * @param {{ recipients: Array<{email:string,name?:string}>, subject: string, html: string }} opts
   */
  async broadcast({ recipients, subject, html }) {
    if (!isConfigured() || !recipients.length) return;
    const BATCH = 20;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const batch = recipients.slice(i, i + BATCH);
      await Promise.all(
        batch.map(r =>
          emailService.send({
            to: r.email,
            subject,
            html: html.replace('{{NAME}}', r.name || 'Valued Member'),
          })
        )
      );
    }
  },

  /**
   * Send staff welcome email containing account credentials.
   * @param {{ to: string, name: string, role: string, password: string, hospitalName?: string }} opts
   */
  async sendStaffCredentials({ to, name, role, password, hospitalName = 'CareSync Hospital' }) {
    const subject = `Welcome to ${hospitalName} — Your Account Credentials`;
    const html = emailService.staffWelcomeHtml({ name, email: to, password, role, hospitalName });
    await emailService.send({ to, subject, html });
  },

  /**
   * Build a styled HTML email body for announcements.
   */
  announcementHtml({ title, message, hospitalName = 'CareSync Hospital' }) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; margin: 0; padding: 24px; }
    .card { background: #ffffff; border-radius: 16px; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #004449, #007A83); padding: 32px 36px; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0 0 4px 0; }
    .header p { color: rgba(255,255,255,0.75); font-size: 13px; margin: 0; }
    .body { padding: 32px 36px; }
    .greeting { font-size: 15px; color: #334155; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; color: #004449; margin-bottom: 12px; }
    .message { font-size: 14px; color: #475569; line-height: 1.7; white-space: pre-wrap; }
    .footer { background: #f8fafc; padding: 20px 36px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>📣 ${hospitalName}</h1>
      <p>Official Announcement</p>
    </div>
    <div class="body">
      <p class="greeting">Dear {{NAME}},</p>
      <p class="title">${title}</p>
      <p class="message">${message}</p>
    </div>
    <div class="footer">
      This message was sent by the ${hospitalName} administration. Please do not reply to this email.
    </div>
  </div>
</body>
</html>`;
  },

  /**
   * Build a styled HTML email body for medical staff login credentials.
   */
  staffWelcomeHtml({ name, email, password, role, hospitalName = 'CareSync Hospital' }) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; }
    .card { background: #ffffff; border-radius: 16px; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #004449, #007A83); padding: 32px 36px; text-align: left; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0 0 4px 0; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; }
    .body { padding: 32px 36px; }
    .greeting { font-size: 16px; color: #0f172a; margin-bottom: 12px; font-weight: 600; }
    .intro { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
    .cred-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
    .cred-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
    .cred-row:last-child { margin-bottom: 0; }
    .cred-label { color: #64748b; font-weight: 500; }
    .cred-value { color: #004449; font-weight: 700; font-family: monospace, monospace; font-size: 15px; }
    .badge { display: inline-block; background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 12px; padding: 3px 10px; border-radius: 999px; }
    .notice { font-size: 13px; color: #64748b; background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px; line-height: 1.5; }
    .footer { background: #f8fafc; padding: 20px 36px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🏥 ${hospitalName}</h1>
      <p>Medical Staff Onboarding Portal</p>
    </div>
    <div class="body">
      <div class="greeting">Welcome, ${name}!</div>
      <div class="intro">
        Your account as a <strong>${role}</strong> at <strong>${hospitalName}</strong> has been created by the administration. You can now log into the CareSync Hospital Management Console using the credentials below:
      </div>

      <div class="cred-box">
        <div class="cred-row">
          <span class="cred-label">Role:</span>
          <span class="badge">${role}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Email / Login ID:</span>
          <span class="cred-value">${email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temporary Password:</span>
          <span class="cred-value">${password}</span>
        </div>
      </div>

      <div class="notice">
        🔒 <strong>Security Advice:</strong> Please log in to your staff portal and update your password immediately after your first login. Do not share these credentials with anyone.
      </div>
    </div>
    <div class="footer">
      Sent by ${hospitalName} Administration via CareSync Health Systems.
    </div>
  </div>
</body>
</html>`;
  },
};
