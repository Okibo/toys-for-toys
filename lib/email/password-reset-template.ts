/**
 * Password Reset Email Template Module
 * Provides HTML and plain text email templates for password reset requests
 */

export interface PasswordResetEmailContent {
  subject: string;
  plainText: string;
  html: string;
}

/**
 * Generate password reset email content
 *
 * @param resetToken - Password reset token
 * @param email - User email address
 * @param language - ISO 639-1 language code (default: 'en')
 * @returns Email content with subject, plain text, and HTML
 */
export function generatePasswordResetEmail(
  resetToken: string,
  email: string,
  language: string = 'en'
): PasswordResetEmailContent {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://toy-for-toy.com';
  const resetUrl = `${appUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;

  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Reset your Toy-for-Toy password',
      greeting: 'Hello,',
      intro: 'We received a request to reset your Toy-for-Toy password. Click the button below to create a new password.',
      expiryNote: 'This link will expire in 24 hours.',
      alternativeMethod: 'Or copy and paste this link into your browser:',
      buttonText: 'Reset Password',
      noActionNeeded: 'If you did not request a password reset, please ignore this email. Your password will not be changed.',
      footer: 'Toy-for-Toy - Cashless Toy Exchange Platform',
      regards: 'Best regards,',
      securityNote: 'For security reasons, never share this link with anyone.',
    },
    pl: {
      subject: 'Zresetuj swoje hasło w serwisie Toy-for-Toy',
      greeting: 'Cześć,',
      intro: 'Otrzymaliśmy żądanie resetu hasła do Twojego konta Toy-for-Toy. Kliknij przycisk poniżej, aby utworzyć nowe hasło.',
      expiryNote: 'Ten link wygaśnie za 24 godziny.',
      alternativeMethod: 'Lub skopiuj i wklej ten link do swojej przeglądarki:',
      buttonText: 'Zresetuj Hasło',
      noActionNeeded: 'Jeśli nie żądałeś resetu hasła, zignoruj tę wiadomość. Twoje hasło nie zostanie zmienione.',
      footer: 'Toy-for-Toy - Platforma Bezgotówkowej Wymiany Zabawek',
      regards: 'Pozdrawiamy,',
      securityNote: 'Ze względów bezpieczeństwa nigdy nie udostępniaj tego linku nikomu.',
    },
    de: {
      subject: 'Setzen Sie Ihr Toy-for-Toy-Passwort zurück',
      greeting: 'Hallo,',
      intro: 'Wir haben eine Anfrage zum Zurücksetzen Ihres Toy-for-Toy-Passworts erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu erstellen.',
      expiryNote: 'Dieser Link läuft in 24 Stunden ab.',
      alternativeMethod: 'Oder kopieren Sie diesen Link und fügen Sie ihn in Ihren Browser ein:',
      buttonText: 'Passwort Zurücksetzen',
      noActionNeeded: 'Wenn Sie kein Passwort zurücksetzen angefordert haben, ignorieren Sie diese E-Mail. Ihr Passwort wird nicht geändert.',
      footer: 'Toy-for-Toy - Plattform für provisionsfreien Spielzeugaustausch',
      regards: 'Freundliche Grüße,',
      securityNote: 'Geben Sie diesen Link aus Sicherheitsgründen an niemanden weiter.',
    },
  };

  const t = translations[language] || translations['en'];

  // Plain text version
  const plainText = `
${t.greeting}

${t.intro}

${t.expiryNote}

${t.alternativeMethod}
${resetUrl}

${t.noActionNeeded}

${t.securityNote}

${t.regards}
${t.footer}
  `.trim();

  // HTML version
  const html = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 20px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .intro {
      font-size: 16px;
      color: #555;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .button-section {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: opacity 0.3s;
    }
    .button:hover {
      opacity: 0.9;
    }
    .expiry-note {
      font-size: 14px;
      color: #e74c3c;
      margin: 20px 0;
      font-style: italic;
      font-weight: 500;
    }
    .link-section {
      margin: 30px 0;
      font-size: 14px;
      color: #555;
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    .link-section a {
      color: #667eea;
      text-decoration: none;
      word-break: break-all;
      display: block;
      margin-top: 10px;
      font-family: monospace;
      font-size: 12px;
    }
    .security-note {
      font-size: 13px;
      color: #c0392b;
      margin: 20px 0;
      padding: 15px;
      background-color: #fadbd8;
      border-radius: 6px;
      border-left: 4px solid #c0392b;
    }
    .footer-text {
      font-size: 14px;
      color: #888;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Toy-for-Toy</h1>
    </div>
    <div class="content">
      <div class="greeting">${t.greeting}</div>
      <p class="intro">${t.intro}</p>

      <div class="button-section">
        <a href="${resetUrl}" class="button">${t.buttonText}</a>
      </div>

      <p class="expiry-note">${t.expiryNote}</p>

      <div class="link-section">
        <p>${t.alternativeMethod}</p>
        <a href="${resetUrl}">${resetUrl}</a>
      </div>

      <div class="security-note">
        ${t.securityNote}
      </div>

      <p class="footer-text">${t.noActionNeeded}</p>
      <p class="footer-text">${t.regards}<br>Toy-for-Toy Team</p>
    </div>
    <div class="footer">
      ${t.footer}
    </div>
  </div>
</body>
</html>
  `.trim();

  return {
    subject: t.subject,
    plainText,
    html,
  };
}

/**
 * Get password reset email subject
 *
 * @param language - ISO 639-1 language code
 * @returns Email subject
 */
export function getPasswordResetEmailSubject(language: string = 'en'): string {
  const subjects: Record<string, string> = {
    en: 'Reset your Toy-for-Toy password',
    pl: 'Zresetuj swoje hasło w serwisie Toy-for-Toy',
    de: 'Setzen Sie Ihr Toy-for-Toy-Passwort zurück',
  };
  return subjects[language] || subjects['en'];
}
