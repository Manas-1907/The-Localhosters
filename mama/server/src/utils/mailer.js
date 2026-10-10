import nodemailer from 'nodemailer';
import { config } from '../config.js';

const { host, port, user, pass, from } = config.smtp;
const transporter = host && user ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }) : null;
if (!transporter) console.warn('SMTP not configured: Support Circle emails will not be sent (invite links can still be shared by hand)');

export async function sendMail({ to, subject, text }) {
  if (!transporter) return { status: 'not_configured' };
  try {
    await transporter.sendMail({ from, to, subject, text });
    return { status: 'sent' };
  } catch (err) {
    console.warn('Email failed:', err.message);
    return { status: 'failed' };
  }
}
