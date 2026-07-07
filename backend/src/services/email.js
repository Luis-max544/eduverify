import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: { user: env.email.user, pass: env.email.pass },
});

export async function sendPasswordReset(toEmail, userId, token) {
  const link = `${env.frontendUrl}/?action=reset&id=${userId}&token=${token}`;
  await transporter.sendMail({
    from: env.email.from,
    to: toEmail,
    subject: 'Restablecer contraseña — EduVerify',
    html: `
      <h2>Restablecer contraseña</h2>
      <p>Haz clic en el siguiente enlace para establecer una nueva contraseña. El enlace expira en 1 hora.</p>
      <a href="${link}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Restablecer contraseña
      </a>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `,
  });
}
