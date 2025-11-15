/**
 * Email Verification Template Module
 * Provides HTML and plain text email templates for email verification
 */

export interface VerificationEmailContent {
  subject: string;
  plainText: string;
  html: string;
}

/**
 * Generate verification email content
 *
 * @param code - 6-digit verification code
 * @param email - User email address
 * @param language - ISO 639-1 language code (default: 'en')
 * @returns Email content with subject, plain text, and HTML
 */
export function generateVerificationEmail(
  code: string,
  email: string,
  language: string = 'en'
): VerificationEmailContent {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://toy-for-toy.com';
  const verificationUrl = `${appUrl}/auth/verify-email?code=${code}&email=${encodeURIComponent(email)}`;

  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Verify your Toy-for-Toy email',
      greeting: 'Hello,',
      intro: 'Thank you for signing up to Toy-for-Toy! Please verify your email address to complete your registration.',
      codeLabel: 'Your verification code is:',
      expiryNote: 'This code will expire in 24 hours.',
      alternativeMethod: 'Or click the button below to verify:',
      buttonText: 'Verify Email',
      linkInstructions: 'If the button above does not work, you can also use this link:',
      noActionNeeded: 'If you did not create this account, please ignore this email.',
      footer: 'Toy-for-Toy - Cashless Toy Exchange Platform',
      regards: 'Best regards,',
    },
    pl: {
      subject: 'Potwierdź swój adres email w serwisie Toy-for-Toy',
      greeting: 'Cześć,',
      intro: 'Dziękujemy za rejestrację w serwisie Toy-for-Toy! Proszę potwierdzić swój adres email, aby ukończyć rejestrację.',
      codeLabel: 'Twój kod weryfikacyjny:',
      expiryNote: 'Ten kod wygaśnie za 24 godziny.',
      alternativeMethod: 'Lub kliknij przycisk poniżej, aby zweryfikować:',
      buttonText: 'Weryfikuj Email',
      linkInstructions: 'Jeśli przycisk powyżej nie działa, możesz użyć tego linku:',
      noActionNeeded: 'Jeśli nie utworzyłeś tego konta, zignoruj tę wiadomość.',
      footer: 'Toy-for-Toy - Platforma Bezgotówkowej Wymiany Zabawek',
      regards: 'Pozdrawiamy,',
    },
  };

  const t = translations[language] || translations['en'];

  // Plain text version
  const plainText = `
${t.greeting}

${t.intro}

${t.codeLabel}
${code}

${t.expiryNote}

${t.alternativeMethod}
${verificationUrl}

${t.linkInstructions}
${verificationUrl}

${t.noActionNeeded}

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
    .code-section {
      background-color: #f9f9f9;
      border: 2px solid #667eea;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .code-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .code {
      font-size: 32px;
      font-weight: 700;
      color: #667eea;
      letter-spacing: 4px;
      font-family: 'Courier New', monospace;
      margin: 10px 0;
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
      color: #888;
      margin: 20px 0;
      font-style: italic;
    }
    .link-section {
      margin: 30px 0;
      font-size: 14px;
      color: #555;
    }
    .link-section a {
      color: #667eea;
      text-decoration: none;
      word-break: break-all;
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

      <div class="code-section">
        <div class="code-label">${t.codeLabel}</div>
        <div class="code">${code}</div>
      </div>

      <p class="expiry-note">${t.expiryNote}</p>

      <div class="button-section">
        <p>${t.alternativeMethod}</p>
        <a href="${verificationUrl}" class="button">${t.buttonText}</a>
      </div>

      <div class="link-section">
        <p>${t.linkInstructions}</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
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
 * Generate verification code email subject
 *
 * @param language - ISO 639-1 language code
 * @returns Email subject
 */
export function getVerificationEmailSubject(language: string = 'en'): string {
  const subjects: Record<string, string> = {
    en: 'Verify your Toy-for-Toy email',
    pl: 'Potwierdź swój adres email w serwisie Toy-for-Toy',
  };
  return subjects[language] || subjects['en'];
}
