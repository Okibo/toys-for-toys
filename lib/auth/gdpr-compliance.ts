/**
 * GDPR Compliance Module
 * Utilities and helpers for GDPR compliance implementation
 */

import type {
  DataCategory,
  GDPRArticleReference,
  ComplianceChecklistItem,
} from '@/lib/types/legal';

/**
 * GDPR Articles Reference Database
 * Contains key articles relevant to the Toy-for-Toy platform
 */
export const GDPR_ARTICLES: Record<number, GDPRArticleReference> = {
  6: {
    article: 6,
    title: 'Lawfulness of processing',
    description:
      'Processing shall be lawful only if and to the extent that at least one of the following applies: (a) the data subject has given consent; (b) processing is necessary for the performance of a contract; (c) processing is necessary for compliance with a legal obligation; (d) processing is necessary to protect vital interests; (e) processing is necessary for the performance of a task carried out in the public interest; (f) processing is necessary for the purposes of legitimate interests.',
    relevantText: 'Article 6, Regulation (EU) 2016/679',
  },
  7: {
    article: 7,
    title: 'Conditions for consent',
    description:
      'Where processing is based on consent, the controller shall be able to demonstrate that the data subject has consented to processing of personal data. It shall be as easy to withdraw as to give consent.',
    relevantText: 'Article 7, Regulation (EU) 2016/679',
  },
  13: {
    article: 13,
    title: 'Information to be provided where personal data are collected from the data subject',
    description:
      'Where personal data relating to a data subject are collected from the data subject, the controller shall, at the time when personal data are obtained, provide the data subject with all of the information.',
    relevantText: 'Article 13, Regulation (EU) 2016/679',
  },
  14: {
    article: 14,
    title: 'Information to be provided where personal data have not been obtained from the data subject',
    description:
      'Where personal data have not been obtained from the data subject, the controller shall provide the data subject with the following information: (a) the identity and the contact details of the controller; (b) the purposes of the processing; (c) the recipients of the personal data.',
    relevantText: 'Article 14, Regulation (EU) 2016/679',
  },
  17: {
    article: 17,
    title: 'Right to erasure',
    description:
      "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay.",
    relevantText: 'Article 17, Regulation (EU) 2016/679',
  },
  20: {
    article: 20,
    title: 'Right to data portability',
    description:
      'The data subject shall have the right to receive the personal data concerning him or her, which he or she has provided to a controller, in a structured, commonly used and machine-readable format.',
    relevantText: 'Article 20, Regulation (EU) 2016/679',
  },
  21: {
    article: 21,
    title: 'Right to object',
    description:
      'The data subject shall have the right to object, on grounds relating to his or her particular situation, at any time to processing of personal data concerning him or her.',
    relevantText: 'Article 21, Regulation (EU) 2016/679',
  },
  32: {
    article: 32,
    title: 'Security of processing',
    description:
      'Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing as well as the risk of varying likelihood and severity for the rights and freedoms of natural persons, the controller and processor shall implement appropriate technical and organisational measures.',
    relevantText: 'Article 32, Regulation (EU) 2016/679',
  },
  35: {
    article: 35,
    title: 'Data Protection Impact Assessment',
    description:
      'Where a type of processing in particular using new technologies, and taking into account the nature, scope, context and purposes of the processing, is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall, prior to the processing, carry out an assessment of the impact of the envisaged processing operations on the protection of personal data.',
    relevantText: 'Article 35, Regulation (EU) 2016/679',
  },
};

/**
 * Legal basis for data processing on Toy-for-Toy platform
 */
export const LEGAL_BASIS_ARTICLE_6 = {
  primary: '6(1)(a)', // Consent
  secondary: '6(1)(b)', // Performance of contract (exchange system)
  description:
    'Processing is based on explicit user consent (Article 6(1)(a)) for all personal data collection. For children, parental consent is required. Additionally, processing of exchange-related data is necessary for the performance of the toy exchange contract (Article 6(1)(b)).',
};

/**
 * Data categories processed by Toy-for-Toy
 */
export const DATA_CATEGORIES: DataCategory[] = [
  {
    name: 'Authentication Data',
    description: 'Email address and password hash for account access',
    piiFields: ['email', 'password_hash'],
    processingPurpose: 'User authentication and account management',
    legalBasis: 'Article 6(1)(a) - Consent; Article 6(1)(b) - Contract performance',
    retentionPeriod: 'Until account deletion',
    retentionDays: undefined, // Account lifetime
    recipients: ['Supabase Auth', 'Support team (if needed for account recovery)'],
    international: true, // Supabase may store data in EU and US
  },
  {
    name: 'Profile Data',
    description: 'User name, profile picture, bio, and preferences',
    piiFields: ['name', 'profile_picture_url', 'bio', 'language_preference'],
    processingPurpose: 'Account management and personalization',
    legalBasis: 'Article 6(1)(a) - Consent; Article 6(1)(b) - Contract performance',
    retentionPeriod: 'Until account deletion',
    retentionDays: undefined,
    recipients: ['Other users (public profile)', 'Support team'],
    international: true,
  },
  {
    name: 'Parental/Guardian Data (Child Accounts)',
    description: 'Parent/guardian email, name, and consent records for children under 16',
    piiFields: ['parent_email', 'parent_name', 'parental_consent_timestamp', 'parental_consent_version'],
    processingPurpose: 'Compliance with GDPR parental consent requirements',
    legalBasis: 'Article 8 GDPR - Parental consent for children',
    retentionPeriod: 'Until child account deletion, plus 3 years for legal compliance',
    retentionDays: 1095, // 3 years
    recipients: ['DPO for audit', 'Legal team'],
    international: true,
  },
  {
    name: 'Toy Listings & Exchange Data',
    description: 'Information about toys being exchanged, condition, photos, and exchange history',
    piiFields: ['toy_name', 'toy_description', 'toy_images', 'condition_details', 'exchange_location_general'],
    processingPurpose: 'Facilitate toy exchanges and track exchange history',
    legalBasis: 'Article 6(1)(b) - Contract performance',
    retentionPeriod: 'Until exchange completed plus 1 year for dispute resolution',
    retentionDays: 365,
    recipients: ['Other users (matching partners)', 'Dispute resolution team'],
    international: true,
  },
  {
    name: 'Ticket/Balance Data',
    description: 'User ticket balance, transaction history, and balance adjustments',
    piiFields: ['ticket_balance', 'transaction_history', 'balance_changes'],
    processingPurpose: 'Manage ticket economy and prevent fraud',
    legalBasis: 'Article 6(1)(b) - Contract performance',
    retentionPeriod: 'Until account deletion plus 3 years for tax/legal purposes',
    retentionDays: undefined,
    recipients: ['Finance team (if needed)', 'Auditors'],
    international: true,
  },
  {
    name: 'Communication Data',
    description: 'Messages, chat history, and correspondence between users',
    piiFields: ['message_content', 'message_timestamp', 'sender_id', 'recipient_id'],
    processingPurpose: 'Facilitate communication between exchange partners',
    legalBasis: 'Article 6(1)(b) - Contract performance',
    retentionPeriod: '2 years after exchange completion for dispute resolution',
    retentionDays: 730,
    recipients: ['Exchange partner', 'Support team (for disputes)', 'Moderation team (if reported)'],
    international: true,
  },
  {
    name: 'Behavioral Analytics Data',
    description: 'Anonymized user behavior, interaction patterns, app usage (opt-in)',
    piiFields: ['None - anonymized and aggregated'],
    processingPurpose: 'Improve user experience and app functionality',
    legalBasis: 'Article 6(1)(a) - Explicit consent for analytics',
    retentionPeriod: '90 days for raw logs, indefinite for aggregated analytics',
    retentionDays: 90,
    recipients: ['Analytics team', 'Product team'],
    international: true,
  },
  {
    name: 'Device & Session Data',
    description: 'Device type, OS version, session IDs, IP address for consent audit trail',
    piiFields: ['device_type', 'os_version', 'ip_address', 'user_agent'],
    processingPurpose: 'Security, fraud prevention, and GDPR compliance audit trail',
    legalBasis: 'Article 6(1)(a) - Consent; Article 6(1)(f) - Legitimate interest (security)',
    retentionPeriod: '1 year for security logs, 3 years for consent audit trail',
    retentionDays: 365,
    recipients: ['Security team', 'Compliance/Legal team'],
    international: true,
  },
  {
    name: 'Ratings & Reviews',
    description: 'User ratings of exchange partners and toy condition, review comments',
    piiFields: ['rating_score', 'review_text', 'reviewer_id'],
    processingPurpose: 'Build trust and reputation system',
    legalBasis: 'Article 6(1)(b) - Contract performance',
    retentionPeriod: 'Indefinite (part of reputation system)',
    retentionDays: undefined,
    recipients: ['Other users (public)', 'Exchange partners', 'Moderation team'],
    international: true,
  },
];

/**
 * Data subject rights that must be supported
 */
export const DATA_SUBJECT_RIGHTS = {
  rightToAccess: {
    article: 15,
    description: 'Right to obtain confirmation of whether personal data is being processed and access to the data',
    implementation: 'User data export functionality at /api/gdpr/export-data',
    timelineBusinessDays: 30,
  },
  rightToErasure: {
    article: 17,
    description: 'Right to request deletion of personal data (Right to be Forgotten)',
    implementation: 'Account deletion flow with data purge at /api/gdpr/delete-account',
    timelineBusinessDays: 30,
    exceptions: 'Data may be retained if needed for legal obligations, dispute resolution (1 year)',
  },
  rightToPortability: {
    article: 20,
    description: 'Right to receive personal data in a structured, commonly used, machine-readable format',
    implementation: 'GDPR export available in JSON format at /api/gdpr/export-data',
    timelineBusinessDays: 30,
  },
  rightToRectification: {
    article: 16,
    description: 'Right to request correction of inaccurate personal data',
    implementation: 'Users can update profile and settings independently',
    timelineBusinessDays: 30,
  },
  rightToObject: {
    article: 21,
    description: 'Right to object to processing of personal data',
    implementation: 'Consent withdrawal available in Settings -> Privacy',
    timelineBusinessDays: 30,
  },
  rightToWithdrawConsent: {
    article: 7,
    description: 'Right to withdraw consent at any time',
    implementation: 'Withdraw analytics consent in Settings -> Privacy',
    timelineBusinessDays: 0, // Immediate
  },
};

/**
 * Standard data retention policies
 */
export const DATA_RETENTION_POLICIES = {
  personalDataDefault: {
    period: 'Until account deletion',
    days: undefined,
    description: 'Most personal data retained until user deletes account',
  },
  consentRecords: {
    period: '3 years',
    days: 1095,
    description: 'Consent records retained for 3 years for compliance audit trail',
  },
  communicationLogs: {
    period: '2 years after exchange completion',
    days: 730,
    description: 'Chat and messages retained 2 years for dispute resolution',
  },
  analyticsRawData: {
    period: '90 days',
    days: 90,
    description: 'Raw behavioral analytics data deleted after 90 days',
  },
  analyticsAggregated: {
    period: 'Indefinite',
    days: undefined,
    description: 'Aggregated, anonymized analytics retained for trend analysis',
  },
  securityLogs: {
    period: '1 year',
    days: 365,
    description: 'IP addresses and device logs from consent audit trail',
  },
  backups: {
    period: '30 days',
    days: 30,
    description: 'Backup copies retained for disaster recovery, then deleted',
  },
};

/**
 * International data transfer safeguards
 */
export const INTERNATIONAL_DATA_TRANSFERS = {
  transfers: [
    {
      destination: 'USA (Supabase/Amazon AWS)',
      legalBasis: 'Standard Contractual Clauses (SCCs)',
      documentationUrl: 'https://supabase.com/docs/guides/platform/security',
      transferType: 'Cloud storage and processing',
      dataCategories: ['All user data', 'Chat messages', 'Profile data'],
    },
    {
      destination: 'USA (Firebase FCM)',
      legalBasis: 'Standard Contractual Clauses (SCCs)',
      documentationUrl: 'https://firebase.google.com/terms/cloud-messaging',
      transferType: 'Push notifications',
      dataCategories: ['Device tokens', 'Notification content'],
    },
    {
      destination: 'USA (SendGrid)',
      legalBasis: 'Standard Contractual Clauses (SCCs)',
      documentationUrl: 'https://sendgrid.com/resource/gdpr/',
      transferType: 'Transactional emails',
      dataCategories: ['Email address', 'Email content'],
    },
  ],
  adequacyDecision: 'No - relies on Standard Contractual Clauses',
  supplementaryMeasures: 'Encryption in transit, minimal data transferred to third parties',
};

/**
 * Generates a GDPR compliance checklist for data protection
 */
export function generateComplianceChecklist(): ComplianceChecklistItem[] {
  return [
    {
      id: 'consent-001',
      category: 'Consent',
      requirement: 'Explicit, informed consent collected before processing personal data',
      description: 'Users must actively opt-in; pre-ticked boxes not allowed',
      completed: false,
    },
    {
      id: 'consent-002',
      category: 'Consent',
      requirement: 'Parental consent collected for users under 16 years old',
      description: 'Parental email verification required; consent records stored',
      completed: false,
    },
    {
      id: 'consent-003',
      category: 'Consent',
      requirement: 'Easy withdrawal mechanism for all consents',
      description: 'Users can withdraw consent as easily as giving it',
      completed: false,
    },
    {
      id: 'access-001',
      category: 'Data Subject Rights',
      requirement: 'Right to access data (Article 15)',
      description: 'Users can download their personal data in machine-readable format',
      completed: false,
    },
    {
      id: 'access-002',
      category: 'Data Subject Rights',
      requirement: 'Right to erasure (Article 17)',
      description: 'Account deletion removes all personal data (within retention exceptions)',
      completed: false,
    },
    {
      id: 'access-003',
      category: 'Data Subject Rights',
      requirement: 'Right to rectification (Article 16)',
      description: 'Users can correct inaccurate personal data',
      completed: false,
    },
    {
      id: 'access-004',
      category: 'Data Subject Rights',
      requirement: 'Right to portability (Article 20)',
      description: 'Users can export data in standard formats (JSON, CSV)',
      completed: false,
    },
    {
      id: 'access-005',
      category: 'Data Subject Rights',
      requirement: 'Right to object (Article 21)',
      description: 'Users can object to certain processing activities',
      completed: false,
    },
    {
      id: 'privacy-001',
      category: 'Privacy Documentation',
      requirement: 'Privacy Policy (Article 13)',
      description: 'Clear, accessible privacy policy in user language',
      completed: false,
    },
    {
      id: 'privacy-002',
      category: 'Privacy Documentation',
      requirement: 'Information about processing purposes',
      description: 'Data subjects informed why data is collected and how it is used',
      completed: false,
    },
    {
      id: 'privacy-003',
      category: 'Privacy Documentation',
      requirement: 'Information about data retention periods',
      description: 'Data subjects know how long their data will be retained',
      completed: false,
    },
    {
      id: 'privacy-004',
      category: 'Privacy Documentation',
      requirement: 'Information about recipients of personal data',
      description: 'Data subjects informed which third parties receive their data',
      completed: false,
    },
    {
      id: 'security-001',
      category: 'Security',
      requirement: 'Encryption in transit (TLS/SSL)',
      description: 'All data transmission secured with TLS 1.2+',
      completed: false,
    },
    {
      id: 'security-002',
      category: 'Security',
      requirement: 'Encryption at rest',
      description: 'Sensitive data encrypted in database',
      completed: false,
    },
    {
      id: 'security-003',
      category: 'Security',
      requirement: 'Access controls and authentication',
      description: 'Strong authentication (email verification, rate limiting)',
      completed: false,
    },
    {
      id: 'security-004',
      category: 'Security',
      requirement: 'Data breach notification plan',
      description: 'Procedures to notify users and authorities within 72 hours',
      completed: false,
    },
    {
      id: 'processor-001',
      category: 'Data Processors',
      requirement: 'Data Processing Agreements (DPA) in place',
      description: 'DPAs with all processors (Supabase, Firebase, SendGrid)',
      completed: false,
    },
    {
      id: 'processor-002',
      category: 'Data Processors',
      requirement: 'Processor sub-processors disclosed',
      description: 'All sub-processors listed and notifiable',
      completed: false,
    },
    {
      id: 'breach-001',
      category: 'Data Breach',
      requirement: 'Breach response procedures documented',
      description: '72-hour notification process and incident response plan',
      completed: false,
    },
    {
      id: 'dpia-001',
      category: 'Risk Assessment',
      requirement: 'Data Protection Impact Assessment (DPIA)',
      description: 'DPIA completed for high-risk processing activities',
      completed: false,
    },
    {
      id: 'dpo-001',
      category: 'Data Protection Officer',
      requirement: 'DPO designated (if required)',
      description: 'DPO contact information published and accessible',
      completed: false,
    },
    {
      id: 'audit-001',
      category: 'Audit & Monitoring',
      requirement: 'Consent audit trail maintained',
      description: 'All consent decisions logged with timestamp, IP, User-Agent',
      completed: false,
    },
  ];
}

/**
 * Formats a retention period for display
 */
export function formatRetentionPeriod(days: number | undefined): string {
  if (days === undefined) {
    return 'Until account deletion';
  }

  if (days <= 0) {
    return 'Immediate deletion';
  }

  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainingDays = days % 30;

  const parts = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  if (remainingDays > 0) parts.push(`${remainingDays} day${remainingDays !== 1 ? 's' : ''}`);

  return parts.join(', ');
}

/**
 * Gets the GDPR article reference by article number
 */
export function getGDPRArticle(articleNumber: number): GDPRArticleReference | null {
  return GDPR_ARTICLES[articleNumber] || null;
}

/**
 * Calculates data retention deadline
 */
export function calculateRetentionDeadline(createdDate: Date, retentionDays: number | undefined): Date | null {
  if (retentionDays === undefined) {
    return null; // Retain indefinitely
  }

  const deadline = new Date(createdDate);
  deadline.setDate(deadline.getDate() + retentionDays);
  return deadline;
}

/**
 * Checks if data should be deleted based on retention policy
 */
export function isDataExpiredForDeletion(createdDate: Date, retentionDays: number | undefined): boolean {
  if (retentionDays === undefined) {
    return false; // Don't delete if indefinite retention
  }

  const deadline = calculateRetentionDeadline(createdDate, retentionDays);
  if (!deadline) return false;

  return new Date() > deadline;
}

/**
 * Generates GDPR compliance summary
 */
export function generateComplianceSummary(): {
  totalCategories: number;
  dataCategories: string[];
  legalBasis: string;
  dataSubjectRights: string[];
} {
  return {
    totalCategories: DATA_CATEGORIES.length,
    dataCategories: DATA_CATEGORIES.map(dc => dc.name),
    legalBasis: LEGAL_BASIS_ARTICLE_6.description,
    dataSubjectRights: Object.keys(DATA_SUBJECT_RIGHTS).map(key => {
      const right = DATA_SUBJECT_RIGHTS[key as keyof typeof DATA_SUBJECT_RIGHTS];
      return `${right.description} (Article ${right.article})`;
    }),
  };
}
