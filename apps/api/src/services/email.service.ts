import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: Number(process.env.SMTP_PORT ?? 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `ClinicOS AI <support@clinicos.workee.online>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (err) {
    logger.error('Failed to send email', { to: options.to, subject: options.subject, err });
    throw err;
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, doctorName: string, clinicName: string): Promise<void> {
  await sendEmail({
    to,
    subject: `Welcome to ${process.env.APP_NAME ?? 'ClinicOS AI'}, ${doctorName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00c896; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ClinicOS AI 🎉</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p style="font-size: 16px; color: #1e293b;">Hi <strong>Dr. ${doctorName}</strong>,</p>
          <p style="color: #64748b; line-height: 1.6;">Your clinic <strong>${clinicName}</strong> is now live on ClinicOS AI. Your AI receptionist is ready to start handling patient messages 24/7.</p>
          <a href="${process.env.APP_URL}/dashboard" style="display: inline-block; background: #00c896; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 24px 0;">
            Go to Dashboard →
          </a>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">Need help? Email us at <a href="mailto:support@clinicos.workee.online" style="color: #00c896;">support@clinicos.workee.online</a></p>
        </div>
      </div>
    `,
  });
}

export async function sendStaffInviteEmail(
  to: string,
  staffName: string,
  clinicName: string,
  inviteLink: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `You've been invited to join ${clinicName} on MediCore AI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00c896; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">You're Invited!</h1>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p style="font-size: 16px; color: #1e293b;">Hi <strong>${staffName}</strong>,</p>
          <p style="color: #64748b;">You've been invited to join <strong>${clinicName}</strong> as a staff member on MediCore AI.</p>
          <a href="${inviteLink}" style="display: inline-block; background: #00c896; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 24px 0;">
            Accept Invitation & Set Password →
          </a>
          <p style="color: #ef4444; font-size: 13px;">This invite link expires in 48 hours.</p>
        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Reset your MediCore AI password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e293b;">Password Reset Request</h2>
        <p style="color: #64748b;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display: inline-block; background: #00c896; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 24px 0;">
          Reset Password →
        </a>
        <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPaymentFailedEmail(to: string, doctorName: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Action required: Your MediCore AI payment failed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #ef4444;">Payment Failed ⚠️</h2>
        <p>Hi ${doctorName}, your subscription payment failed. Please update your payment method to keep your AI receptionist running.</p>
        <a href="${process.env.APP_URL}/dashboard/billing" style="display: inline-block; background: #ef4444; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold;">
          Update Payment Method →
        </a>
      </div>
    `,
  });
}

export async function sendDailySummaryEmail(
  to: string,
  doctorName: string,
  data: {
    todayCount: number;
    yesterdayMessages: number;
    aiHandled: number;
  }
): Promise<void> {
  await sendEmail({
    to,
    subject: `Your daily summary — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e293b;">Good morning, Dr. ${doctorName} 👋</h2>
        <div style="display: flex; gap: 16px; margin: 24px 0;">
          <div style="background: #e6faf5; border-radius: 12px; padding: 20px; flex: 1; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: #00c896;">${data.todayCount}</div>
            <div style="color: #64748b; font-size: 13px;">Appointments Today</div>
          </div>
          <div style="background: #eff6ff; border-radius: 12px; padding: 20px; flex: 1; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; color: #3b82f6;">${data.aiHandled}</div>
            <div style="color: #64748b; font-size: 13px;">AI Messages Yesterday</div>
          </div>
        </div>
        <a href="${process.env.APP_URL}/dashboard" style="display: inline-block; background: #00c896; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold;">
          View Full Dashboard →
        </a>
      </div>
    `,
  });
}

export async function sendTrialExpiryEmail(to: string, doctorName: string, daysLeft: number): Promise<void> {
  await sendEmail({
    to,
    subject: `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #f59e0b;">Your trial is almost over ⏰</h2>
        <p>Hi Dr. ${doctorName}, your MediCore AI free trial ends in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>. Upgrade now to keep your AI receptionist running without interruption.</p>
        <a href="${process.env.APP_URL}/dashboard/billing" style="display: inline-block; background: #00c896; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold;">
          Upgrade Now →
        </a>
      </div>
    `,
  });
}
