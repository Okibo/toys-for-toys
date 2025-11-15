/**
 * Legal Document Types Module
 * Defines TypeScript interfaces for legal content, versioning, and metadata
 */

/**
 * Supported languages for legal documents
 */
export type LegalLanguage = 'en' | 'pl' | 'de';

/**
 * Types of legal documents
 */
export type LegalDocumentType = 'terms' | 'privacy' | 'analytics';

/**
 * Legal document version metadata
 */
export interface LegalDocumentVersion {
  version: string; // Semantic version (e.g., "1.0.0")
  releaseDate: string; // ISO 8601 date
  effectiveDate: string; // ISO 8601 date
  lastModified: string; // ISO 8601 timestamp
  status: 'draft' | 'active' | 'archived' | 'deprecated';
  changelog?: string[];
}

/**
 * Complete legal document with metadata and content
 */
export interface LegalDocument {
  id: string; // Unique identifier
  type: LegalDocumentType;
  language: LegalLanguage;
  version: LegalDocumentVersion;
  title: string;
  content: string; // Markdown or HTML content
  summary?: string; // Brief description
  sections: LegalDocumentSection[];
  metadata: LegalDocumentMetadata;
}

/**
 * Section within a legal document
 */
export interface LegalDocumentSection {
  id: string;
  title: string;
  content: string;
  subsections?: LegalDocumentSection[];
  order: number;
}

/**
 * Metadata for legal documents
 */
export interface LegalDocumentMetadata {
  author: string; // Author name or organization
  jurisdiction: string; // Legal jurisdiction (e.g., "EU", "PL", "DE")
  applicableLaws: string[]; // Relevant laws (e.g., GDPR, COPPA, KDPR)
  dataController: string; // Organization name
  dataControllerAddress: string;
  dpoEmail?: string; // Data Protection Officer email
  contactEmail: string;
  lastReviewDate: string; // ISO 8601 date
  nextReviewDate: string; // ISO 8601 date
  tags: string[];
}

/**
 * Consent type enumeration
 */
export type ConsentType = 'privacy_policy' | 'terms_of_service' | 'behavioral_analytics';

/**
 * Consent record stored in database
 */
export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  consent_given: boolean;
  timestamp: string; // ISO 8601 timestamp
  ip_address?: string;
  user_agent?: string;
  withdrawn_at?: string; // ISO 8601 timestamp
  document_version?: string; // Version of document user consented to
}

/**
 * Consent payload for validation
 */
export interface ConsentPayload {
  user_id: string;
  privacy_policy: boolean;
  terms_of_service: boolean;
  behavioral_analytics?: boolean; // Optional
  document_versions?: {
    privacy_policy?: string;
    terms_of_service?: string;
    behavioral_analytics?: string;
  };
  ip_address?: string;
  user_agent?: string;
}

/**
 * Result of consent validation
 */
export interface ConsentValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  fieldErrors?: {
    [key: string]: string[];
  };
}

/**
 * Consent withdrawal request
 */
export interface ConsentWithdrawalRequest {
  user_id: string;
  consent_types: ConsentType[];
  reason?: string;
}

/**
 * Legal document registry
 */
export interface LegalDocumentRegistry {
  documents: Map<string, LegalDocument>; // Map by `${type}_${language}_${version}`
  activeVersions: Map<string, LegalDocumentVersion>; // Current active versions by type
}

/**
 * GDPR article references for legal basis
 */
export interface GDPRArticleReference {
  article: number;
  title: string;
  description: string;
  relevantText?: string;
}

/**
 * Data category definition
 */
export interface DataCategory {
  name: string;
  description: string;
  piiFields: string[];
  processingPurpose: string;
  legalBasis: string; // GDPR article or provision
  retentionPeriod: string; // Human-readable period
  retentionDays?: number;
  recipients: string[]; // Third parties that receive data
  international?: boolean; // If data is transferred internationally
}

/**
 * GDPR compliance checklist item
 */
export interface ComplianceChecklistItem {
  id: string;
  category: string; // e.g., "Consent", "Data Rights", "Security", "Documentation"
  requirement: string;
  description: string;
  completed: boolean;
  evidenceFiles?: string[];
  reviewDate?: string;
  reviewer?: string;
  notes?: string;
}

/**
 * GDPR compliance audit result
 */
export interface ComplianceAuditResult {
  timestamp: string; // ISO 8601 timestamp
  totalItems: number;
  completedItems: number;
  percentage: number;
  category: string;
  items: ComplianceChecklistItem[];
  recommendations?: string[];
  criticalIssues?: string[];
}
