/**
 * Password Changed Confirmation Email Template Module
 * Provides HTML and plain text email templates for password change confirmation
 */

export interface PasswordChangedEmailContent {
  subject: string;
  plainText: string;
  html: string;
}

/**
 * Generate password changed confirmation email content
 *
 * @param email - User email address
 * @param language - ISO 639-1 language code (default: 'en')
 * @returns Email content with subject, plain text, and HTML
 */
export function generatePasswordChangedEmail(
  email: string,
  language: string = 'en'
): PasswordChangedEmailContent {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://toy-for-toy.com';
  const loginUrl = `${appUrl}/auth/login`;

  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      subject: 'Your Toy-for-Toy password has been changed',
      greeting: 'Hello,',
      intro: 'This is to confirm that your Toy-for-Toy account password has been successfully reset.',
      details: 'If you did not make this change, please contact our support team immediately.',
      securityTip: 'Security Tip: Use a unique, strong password for your account. Never share your password with anyone.',
      nextSteps: 'Next Steps:',
      loginInstructions: 'Log in with your new password',
      footer: 'Toy-for-Toy - Cashless Toy Exchange Platform',
      regards: 'Best regards,',
      supportNote: 'If you have any concerns about your account security, please contact us at support@toy-for-toy.com',
      dontShare: 'Remember: Never share your login credentials with anyone.',
    },
    pl: {
      subject: 'Twoje hasło w serwisie Toy-for-Toy zostało zmienione',
      greeting: 'Cześć,',
      intro: 'Potwierdzamy, że hasło do Twojego konta Toy-for-Toy zostało pomyślnie zresetowane.',
      details: 'Jeśli nie dokonałeś tej zmiany, skontaktuj się natychmiast z naszym zespołem wsparcia.',
      securityTip: 'Wskazówka bezpieczeństwa: Używaj unikalnego, silnego hasła do swojego konta. Nigdy nie udostępniaj swojego hasła nikomu.',
      nextSteps: 'Następne kroki:',
      loginInstructions: 'Zaloguj się przy użyciu nowego hasła',
      footer: 'Toy-for-Toy - Platforma Bezgotówkowej Wymiany Zabawek',
      regards: 'Pozdrawiamy,',
      supportNote: 'Jeśli masz jakiekolwiek obawy dotyczące bezpieczeństwa swojego konta, skontaktuj się z nami pod adresem support@toy-for-toy.com',
      dontShare: 'Pamiętaj: Nigdy nie udostępniaj swoich danych logowania nikomu.',
    },
    de: {
      subject: 'Ihr Toy-for-Toy-Passwort wurde geändert',
      greeting: 'Hallo,',
      intro: 'Dies bestätigt, dass das Passwort Ihres Toy-for-Toy-Kontos erfolgreich zurückgesetzt wurde.',
      details: 'Wenn Sie diese Änderung nicht vorgenommen haben, wenden Sie sich bitte sofort an unser Support-Team.',
      securityTip: 'Sicherheitstipp: Verwenden Sie ein eindeutiges, starkes Passwort für Ihr Konto. Teilen Sie Ihr Passwort niemals mit anderen.',
      nextSteps: 'Nächste Schritte:',
      loginInstructions: 'Melden Sie sich mit Ihrem neuen Passwort an',
      footer: 'Toy-for-Toy - Plattform für provisionsfreien Spielzeugaustausch',
      regards: 'Freundliche Grüße,',
      supportNote: 'Wenn Sie Bedenken zur Sicherheit Ihres Kontos haben, wenden Sie sich bitte unter support@toy-for-toy.com an uns',
      dontShare: 'Denken Sie daran: Geben Sie Ihre Anmeldedaten niemals an andere weiter.',
    },
  };

  const t = translations[language] || translations['en'];

  // Plain text version
  const plainText = `
${t.greeting}

${t.intro}

${t.details}

${t.securityTip}

${t.nextSteps}
- ${t.loginInstructions}
  ${loginUrl}

${t.dontShare}

${t.supportNote}

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
      background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header .check-icon {
      font-size: 40px;
      margin-bottom: 10px;
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
      color: #27ae60;
      margin-bottom: 20px;
      font-weight: 600;
      line-height: 1.8;
    }
    .details {
      font-size: 15px;
      color: #555;
      margin-bottom: 25px;
      line-height: 1.8;
    }
    .security-tip {
      font-size: 14px;
      color: #d35400;
      margin: 25px 0;
      padding: 15px;
      background-color: #fef5e7;
      border-radius: 6px;
      border-left: 4px solid #d35400;
    }
    .next-steps {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin: 25px 0 15px 0;
    }
    .steps-list {
      margin: 0;
      padding-left: 20px;
    }
    .steps-list li {
      margin-bottom: 10px;
      color: #555;
    }
    .button-section {
      text-align: center;
      margin: 25px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
      color: white;
      padding: 12px 35px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      transition: opacity 0.3s;
    }
    .button:hover {
      opacity: 0.9;
    }
    .dont-share {
      font-size: 14px;
      color: #c0392b;
      margin: 20px 0;
      padding: 15px;
      background-color: #fadbd8;
      border-radius: 6px;
      border-left: 4px solid #c0392b;
      font-weight: 500;
    }
    .support-note {
      font-size: 13px;
      color: #7f8c8d;
      margin-top: 25px;
      padding-top: 20px;
      border-top: 1px solid #ecf0f1;
    }
    .support-note a {
      color: #3498db;
      text-decoration: none;
    }
    .footer-text {
      font-size: 14px;
      color: #888;
      margin-top: 25px;
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
      <div class="check-icon">✓</div>
      <h1>Password Changed</h1>
    </div>
    <div class="content">
      <div class="greeting">${t.greeting}</div>
      <p class="intro">${t.intro}</p>
      <p class="details">${t.details}</p>

      <div class="security-tip">
        <strong>🔒 ${t.securityTip}</strong>
      </div>

      <div class="next-steps">${t.nextSteps}</div>
      <ul class="steps-list">
        <li>${t.loginInstructions}</li>
      </ul>

      <div class="button-section">
        <a href="${loginUrl}" class="button">Go to Login</a>
      </div>

      <div class="dont-share">
        ${t.dontShare}
      </div>

      <div class="support-note">
        ${t.supportNote}
      </div>

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
 * Get password changed email subject
 *
 * @param language - ISO 639-1 language code
 * @returns Email subject
 */
export function getPasswordChangedEmailSubject(language: string = 'en'): string {
  const subjects: Record<string, string> = {
    en: 'Your Toy-for-Toy password has been changed',
    pl: 'Twoje hasło w serwisie Toy-for-Toy zostało zmienione',
    de: 'Ihr Toy-for-Toy-Passwort wurde geändert',
  };
  return subjects[language] || subjects['en'];
}
