import nodemailer from "nodemailer";
import env from "../config/env.js";

const isSmtpConfigured = () => {
  return Boolean(
    env.smtpHost &&
      env.smtpPort &&
      env.smtpUser &&
      env.smtpPassword &&
      env.smtpFrom
  );
};

const createTransporter = async () => {
  if (isSmtpConfigured()) {
    return {
      transporter: nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpPort === 465,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPassword,
        },
      }),
      from: env.smtpFrom,
      isTestTransport: false,
    };
  }

  if (env.nodeEnv !== "production" && env.emailDevMode === "ethereal") {
    const testAccount = await nodemailer.createTestAccount();
    return {
      transporter: nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      }),
      from: env.smtpFrom || "FixMyCampus Dev <no-reply@fixmycampus.local>",
      isTestTransport: true,
    };
  }

  const err = new Error(
    "Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in backend/.env."
  );
  err.statusCode = 503;
  throw err;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const { transporter, from, isTestTransport } = await createTransporter();

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  if (isTestTransport) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Ethereal dev email preview: ${previewUrl}`);
    }
  }

  return info;
};

export const sendInvitationEmail = async ({
  to,
  name,
  role,
  department,
  activationUrl,
  expiresHours,
}) => {
  const roleLabel = role === "admin" ? "Administrator" : "Maintenance Staff";
  const deptLine = department ? ` (${department})` : "";
  const subject = "Activate your FixMyCampus account";

  const text = [
    `Hello ${name},`,
    "",
    `You have been invited to join FixMyCampus as ${roleLabel}${deptLine}.`,
    `Activate your account and set your password using the link below (expires in ${expiresHours} hours):`,
    activationUrl,
    "",
    "If you did not expect this invitation, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 12px; font-size: 20px;">Welcome to FixMyCampus</h2>
      <p style="margin: 0 0 12px; line-height: 1.5;">Hello ${name},</p>
      <p style="margin: 0 0 16px; line-height: 1.5;">
        You have been invited to join <strong>FixMyCampus</strong> as <strong>${roleLabel}${deptLine}</strong>.
      </p>
      <p style="margin: 0 0 20px;">
        <a href="${activationUrl}" style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600;">
          Activate Account &amp; Set Password
        </a>
      </p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #475569;">
        This invitation link expires in ${expiresHours} hours and can only be used once.
      </p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

export const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
  expiresMinutes,
}) => {
  const subject = "Reset your FixMyCampus password";

  const text = [
    `Hello ${name},`,
    "",
    `We received a request to reset your FixMyCampus password.`,
    `Use the link below within ${expiresMinutes} minutes to set a new password:`,
    resetUrl,
    "",
    "If you did not request a password reset, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 12px; font-size: 20px;">Reset Your Password</h2>
      <p style="margin: 0 0 12px; line-height: 1.5;">Hello ${name},</p>
      <p style="margin: 0 0 16px; line-height: 1.5;">
        We received a request to reset your <strong>FixMyCampus</strong> password.
      </p>
      <p style="margin: 0 0 20px;">
        <a href="${resetUrl}" style="display: inline-block; background: #1d4ed8; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #475569;">
        This link expires in ${expiresMinutes} minutes and can only be used once.
      </p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};
