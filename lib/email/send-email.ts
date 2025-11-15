/**
 * Email Sending Module
 * Handles transactional email sending via SendGrid or Mailhog (development)
 */

import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  plainText: string;
}

/**
 * Create email transporter based on environment
 * Uses Mailhog in development, SendGrid in production
 */
function createTransporter() {
  if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY) {
    // Development: use Mailhog SMTP
    return nodemailer.createTransport({
      host: 'localhost',
      port: parseInt(process.env.MAILHOG_SMTP_PORT || '1025', 10),
      secure: false,
    });
  }

  // Production: use SendGrid
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (!sendGridApiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is not set for production email sending');
  }

  return nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: sendGridApiKey,
    },
  });
}

/**
 * Get the "from" email address
 */
function getFromEmail(): string {
  return process.env.SENDGRID_FROM_EMAIL || 'noreply@toy-for-toy.local';
}

/**
 * Send an email
 *
 * @param options - Email options (to, subject, html, plainText)
 * @returns Promise that resolves when email is sent
 * @throws Error if email sending fails
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = createTransporter();
    const fromEmail = getFromEmail();

    const info = await transporter.sendMail({
      from: `Toy-for-Toy <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.plainText,
      html: options.html,
    });

    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send verification email
 *
 * @param email - Recipient email address
 * @param code - 6-digit verification code
 * @param subject - Email subject
 * @param html - HTML email body
 * @param plainText - Plain text email body
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  subject: string,
  html: string,
  plainText: string
): Promise<void> {
  // Log code for debugging (never in production logs!)
  if (process.env.NODE_ENV === 'development') {
    console.log(`Verification code for ${email}: ${code}`);
  }

  return sendEmail({
    to: email,
    subject,
    html,
    plainText,
  });
}

/**
 * Mock email sending for testing
 * Used when testing without actual email service
 */
export async function mockSendEmail(options: EmailOptions): Promise<void> {
  console.log('MOCK: Email would be sent to:', options.to);
  console.log('MOCK: Subject:', options.subject);
  console.log('MOCK: HTML length:', options.html.length);
}
