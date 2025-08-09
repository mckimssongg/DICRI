import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false
});

export async function sendMail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@dicri.local',
      to, subject, html
    });
  } catch (e) {
    // no tumbar el flujo en dev
    console.error('sendMail error', (e as Error).message);
  }
}
