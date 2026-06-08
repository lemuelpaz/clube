import nodemailer from 'nodemailer'
import type { SmtpConfig } from '@/types'

export function createTransporter(cfg: SmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.password },
  })
}

export async function sendPasswordResetEmail(
  cfg: SmtpConfig,
  opts: { to: string; name: string; resetUrl: string },
) {
  const transporter = createTransporter(cfg)
  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
    to: opts.to,
    subject: 'Redefinição de senha — Clube Elite',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0A0A0A;color:#f5f5f5;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#C41E3A,#8B0000);padding:32px;text-align:center;">
          <h1 style="margin:0;font-size:24px;color:#fff;">Clube Elite</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 8px;font-size:16px;">Olá, <strong>${opts.name}</strong></p>
          <p style="margin:0 0 24px;color:#aaa;font-size:14px;">
            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
          </p>
          <a href="${opts.resetUrl}"
            style="display:inline-block;background:#C41E3A;color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;">
            Redefinir senha
          </a>
          <p style="margin:24px 0 0;color:#666;font-size:12px;">
            Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição, ignore este e-mail.
          </p>
          <p style="margin:8px 0 0;color:#666;font-size:12px;">
            Ou copie e cole este link: <br/><span style="color:#C41E3A;">${opts.resetUrl}</span>
          </p>
        </div>
      </div>
    `,
  })
}
