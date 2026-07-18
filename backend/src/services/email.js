import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.resendApiKey);

export async function sendPasswordReset(toEmail, userId, token) {
  const link = `${env.frontendUrl}/?action=reset&id=${userId}&token=${token}`;
  try {
    await resend.emails.send({
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
  } catch (err) {
    console.error('sendMail failed:', err.message);
    throw err;
  }
}
