/**
 * Legal Document Loader
 * Utility for loading legal documents by language and version
 * Supports caching for performance optimization
 * Implements document versioning system
 */

export type DocumentType = 'terms' | 'privacy' | 'analytics';
export type LanguageCode = 'en' | 'pl' | 'de';

interface CacheEntry {
  content: string;
  timestamp: number;
}

// In-memory cache for legal documents
const documentCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Get cache key for a document
 */
function getCacheKey(type: DocumentType, language: LanguageCode, version: string): string {
  return `${type}_${language}_${version}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now();
  return now - entry.timestamp < CACHE_TTL;
}

/**
 * Load a legal document by type and language
 * Returns cached version if available and valid
 */
export async function loadDocument(
  type: DocumentType,
  language: LanguageCode = 'en',
  version: string = '1.0'
): Promise<string> {
  const cacheKey = getCacheKey(type, language, version);

  // Check cache
  const cached = documentCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.content;
  }

  try {
    // Load document from public directory
    const fileName = `${type}_${language}_v${version}.md`;
    const filePath = `/legal/${fileName}`;

    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load document: ${response.statusText}`);
    }

    const content = await response.text();

    // Cache the document
    documentCache.set(cacheKey, {
      content,
      timestamp: Date.now()
    });

    return content;
  } catch (error) {
    console.error(`Error loading legal document ${type} (${language}):`, error);

    // Return fallback content if loading fails
    return getFallbackDocument(type);
  }
}

/**
 * Load all documents for a language
 */
export async function loadDocumentsByLanguage(
  language: LanguageCode = 'en'
): Promise<Record<DocumentType, string>> {
  const types: DocumentType[] = ['terms', 'privacy', 'analytics'];

  const results: Record<string, string> = {};

  for (const type of types) {
    results[type] = await loadDocument(type, language);
  }

  return results as Record<DocumentType, string>;
}

/**
 * Clear the document cache
 */
export function clearCache(): void {
  documentCache.clear();
}

/**
 * Clear cache for specific document
 */
export function clearDocumentCache(
  type: DocumentType,
  language: LanguageCode,
  version: string = '1.0'
): void {
  const cacheKey = getCacheKey(type, language, version);
  documentCache.delete(cacheKey);
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; timestamp: number }>;
} {
  const entries = Array.from(documentCache.entries()).map(([key, entry]) => ({
    key,
    timestamp: entry.timestamp
  }));

  return {
    size: documentCache.size,
    entries
  };
}

/**
 * Preload documents for better performance
 */
export async function preloadDocuments(
  language: LanguageCode = 'en'
): Promise<void> {
  const types: DocumentType[] = ['terms', 'privacy', 'analytics'];

  await Promise.all(
    types.map(type => loadDocument(type, language))
  );
}

/**
 * Get available versions for a document type
 */
export function getAvailableVersions(type: DocumentType): string[] {
  // In a real implementation, this would list available versions
  // For now, return a default set
  return ['1.0', '1.1', '2.0'];
}

/**
 * Fallback content if document loading fails
 */
function getFallbackDocument(type: DocumentType): string {
  const fallbacks: Record<DocumentType, string> = {
    terms: `
# Terms of Service

## Default Fallback Content

If you are seeing this, the legal documents could not be loaded.

Please contact support for assistance.

Version: 1.0
Last Updated: 2024-01-15
    `.trim(),
    privacy: `
# Privacy Policy

## Default Fallback Content

If you are seeing this, the legal documents could not be loaded.

Please contact support for assistance.

Version: 1.0
Last Updated: 2024-01-15
    `.trim(),
    analytics: `
# Analytics Policy

## Default Fallback Content

If you are seeing this, the legal documents could not be loaded.

Please contact support for assistance.

Version: 1.0
Last Updated: 2024-01-15
    `.trim()
  };

  return fallbacks[type];
}

/**
 * Validate document format and structure
 */
export function validateDocument(content: string, type: DocumentType): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for minimum length
  if (content.length < 100) {
    errors.push('Document is too short');
  }

  // Check for required headers based on type
  const requiredHeaders: Record<DocumentType, string[]> = {
    terms: ['Terms', 'Conditions'],
    privacy: ['Privacy', 'Data'],
    analytics: ['Analytics', 'Data', 'Tracking']
  };

  const headers = requiredHeaders[type];
  for (const header of headers) {
    if (!content.includes(header)) {
      errors.push(`Missing required section: ${header}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get document metadata
 */
export interface DocumentMetadata {
  type: DocumentType;
  language: LanguageCode;
  version: string;
  lastUpdated: string;
}

export function getDocumentMetadata(
  type: DocumentType,
  language: LanguageCode,
  version: string = '1.0'
): DocumentMetadata {
  return {
    type,
    language,
    version,
    lastUpdated: new Date().toISOString()
  };
}
