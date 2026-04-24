import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

// ── Transporter (configure SMTP in .env) ─────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = `"Base 2 Media Academy" <${process.env.SMTP_USER || 'noreply@base2media.ac'}>`;

// ── Email Templates ───────────────────────────────────────────────

export async function sendGradeNotification(opts: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  subjectName: string;
  score: number;
  letterGrade: string;
  descriptiveWord: string;
  term: string;
}) {
  const scoreColor = opts.score >= 80 ? '#22c55e' : opts.score >= 60 ? '#f59e0b' : '#ef4444';

  await transporter.sendMail({
    from: FROM,
    to: opts.parentEmail,
    subject: `📚 New Grade Posted — ${opts.studentName} | ${opts.subjectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0d14; color: #f0f4ff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #a855f7, #3b82f6); padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; color: #fff;">Base 2 Media Academy</h1>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">Grade Notification</p>
        </div>
        <div style="padding: 28px;">
          <p>Dear ${opts.parentName},</p>
          <p>A new grade has been posted for <strong>${opts.studentName}</strong> in <strong>${opts.subjectName}</strong> for <strong>${opts.term}</strong>.</p>
          <div style="background: #111827; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 48px; font-weight: 900; color: ${scoreColor}; line-height: 1;">${opts.score}%</div>
            <div style="font-size: 20px; font-weight: 700; color: ${scoreColor}; margin-top: 4px;">${opts.letterGrade} — ${opts.descriptiveWord}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 8px;">${opts.subjectName}</div>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">Log in to your parent portal to see the full academic report.</p>
        </div>
        <div style="padding: 16px 28px; border-top: 1px solid #1e2d45; font-size: 11px; color: #4b6080; text-align: center;">
          © Base 2 Media Academy — This is an automated notification.
        </div>
      </div>
    `,
  });
}

export async function sendAbsenceNotification(opts: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  date: string;
  className: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: opts.parentEmail,
    subject: `⚠ Absence Alert — ${opts.studentName} was absent on ${opts.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0d14; color: #f0f4ff; border-radius: 12px; overflow: hidden;">
        <div style="background: #ef4444; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; color: #fff;">Base 2 Media Academy</h1>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">⚠ Absence Notification</p>
        </div>
        <div style="padding: 28px;">
          <p>Dear ${opts.parentName},</p>
          <p>This is to notify you that <strong>${opts.studentName}</strong> was marked <strong style="color: #ef4444;">ABSENT</strong> on <strong>${opts.date}</strong> from class <strong>${opts.className}</strong>.</p>
          <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 14px; margin: 16px 0; font-size: 13px; color: #f87171;">
            If this absence was planned or due to illness, please inform the school office as soon as possible.
          </div>
          <p style="color: #94a3b8; font-size: 13px;">Log in to the parent portal to view full attendance history.</p>
        </div>
        <div style="padding: 16px 28px; border-top: 1px solid #1e2d45; font-size: 11px; color: #4b6080; text-align: center;">
          © Base 2 Media Academy — This is an automated notification.
        </div>
      </div>
    `,
  });
}

export async function sendPaymentConfirmation(opts: {
  parentEmail: string;
  parentName: string;
  studentName: string;
  amount: number;
  reference: string;
  term: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to: opts.parentEmail,
    subject: `✅ Payment Confirmed — GH₵${opts.amount} received`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0d14; color: #f0f4ff; border-radius: 12px; overflow: hidden;">
        <div style="background: #22c55e; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; color: #fff;">Base 2 Media Academy</h1>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">✅ Payment Confirmation</p>
        </div>
        <div style="padding: 28px;">
          <p>Dear ${opts.parentName},</p>
          <p>We have successfully received a fee payment for <strong>${opts.studentName}</strong>.</p>
          <div style="background: #111827; border-radius: 10px; padding: 20px; margin: 16px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
              <span style="color: #64748b;">Amount Paid</span>
              <strong style="color: #22c55e; font-size: 18px;">GH₵ ${opts.amount.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px;">
              <span style="color: #64748b;">Reference</span><span>${opts.reference}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
              <span style="color: #64748b;">Term</span><span>${opts.term}</span>
            </div>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">Log in to the parent portal to download your payment receipt.</p>
        </div>
        <div style="padding: 16px 28px; border-top: 1px solid #1e2d45; font-size: 11px; color: #4b6080; text-align: center;">
          © Base 2 Media Academy — This is an automated receipt.
        </div>
      </div>
    `,
  });
}

export async function sendPasswordReset(opts: { email: string; name: string; resetLink: string }) {
  await transporter.sendMail({
    from: FROM,
    to: opts.email,
    subject: '🔑 Reset Your Password — Base 2 Media Academy',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0d14; color: #f0f4ff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #a855f7, #3b82f6); padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; color: #fff;">Base 2 Media Academy</h1>
          <p style="margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">Password Reset</p>
        </div>
        <div style="padding: 28px;">
          <p>Dear ${opts.name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${opts.resetLink}" style="display: inline-block; padding: 13px 28px; background: linear-gradient(135deg, #a855f7, #3b82f6); color: #fff; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 14px;">Reset My Password</a>
          </div>
          <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 12px; font-size: 12px; color: #fbbf24;">
            ⏱ This link will expire in 30 minutes. If you did not request a password reset, you can safely ignore this email.
          </div>
        </div>
        <div style="padding: 16px 28px; border-top: 1px solid #1e2d45; font-size: 11px; color: #4b6080; text-align: center;">
          © Base 2 Media Academy — This is an automated security email.
        </div>
      </div>
    `,
  });
}
