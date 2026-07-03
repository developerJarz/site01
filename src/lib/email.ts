import nodemailer from "nodemailer";

/**
 * Send OTP email via Brevo HTTP API (works reliably on serverless platforms
 * where SMTP ports may be blocked).
 */
async function sendViaBrevoApi(
  to: string,
  fromEmail: string,
  otpCode: string,
  apiKey: string
): Promise<{ success: boolean }> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "CarHat.bd", email: fromEmail },
      to: [{ email: to }],
      subject: "Your CarHat Verification Code",
      htmlContent: buildOtpHtml(otpCode),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${body}`);
  }

  console.log("✅ Email sent via Brevo HTTP API");
  return { success: true };
}

/**
 * Send OTP email via SMTP (nodemailer).
 */
async function sendViaSmtp(
  to: string,
  smtpHost: string,
  smtpPort: number,
  smtpUser: string,
  smtpPass: string,
  smtpFrom: string,
  otpCode: string
): Promise<{ success: boolean }> {
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const info = await transporter.sendMail({
    from: `"CarHat.bd" <${smtpFrom}>`,
    to,
    subject: "Your CarHat Verification Code",
    html: buildOtpHtml(otpCode),
  });

  console.log("✅ Email sent via SMTP: " + info.response);
  return { success: true };
}

function buildOtpHtml(otpCode: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #3b82f6;">CarHat.bd Registration</h2>
      <p>Hello,</p>
      <p>Thank you for registering on CarHat.bd. Please use the verification code below to complete your registration.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otpCode}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This code will expire in 5 minutes.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
}

export async function sendOtpEmail(email: string, otpCode: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  const brevoApiKey = process.env.BREVO_API_KEY;

  // If no SMTP credentials at all, mock the email
  if (!smtpHost && !smtpUser && !smtpPass && !brevoApiKey) {
    console.log(`\n\n==========================================`);
    console.log(`[MOCK EMAIL] To: ${email}`);
    console.log(`[MOCK EMAIL] Subject: CarHat Verification Code`);
    console.log(`[MOCK EMAIL] OTP: ${otpCode}`);
    console.log(`==========================================\n\n`);
    return { success: true, mocked: true };
  }

  console.log(`📧 Attempting to send OTP to ${email}...`);
  console.log(`   SMTP_HOST: ${smtpHost || "(not set)"}`);
  console.log(`   SMTP_PORT: ${smtpPort || "(not set)"}`);
  console.log(`   SMTP_USER: ${smtpUser ? smtpUser.substring(0, 5) + "..." : "(not set)"}`);
  console.log(`   SMTP_FROM: ${smtpFrom || "(not set)"}`);
  console.log(`   BREVO_API_KEY: ${brevoApiKey ? "set (" + brevoApiKey.substring(0, 8) + "...)" : "(not set)"}`);

  // Strategy 1: Try Brevo HTTP API first (most reliable on serverless)
  if (brevoApiKey && smtpFrom) {
    try {
      return await sendViaBrevoApi(email, smtpFrom, otpCode, brevoApiKey);
    } catch (err: any) {
      console.error("❌ Brevo HTTP API failed:", err.message);
      // Fall through to SMTP
    }
  }

  // Strategy 2: Try SMTP
  if (smtpHost && smtpUser && smtpPass && smtpFrom) {
    try {
      return await sendViaSmtp(
        email,
        smtpHost,
        Number(smtpPort) || 587,
        smtpUser,
        smtpPass,
        smtpFrom,
        otpCode
      );
    } catch (err: any) {
      console.error("❌ SMTP send failed:", err.message);
      console.error("   Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      throw new Error(`Email sending failed: ${err.message}`);
    }
  }

  throw new Error(
    "Email configuration incomplete. Set SMTP_HOST/SMTP_USER/SMTP_PASS or BREVO_API_KEY."
  );
}

