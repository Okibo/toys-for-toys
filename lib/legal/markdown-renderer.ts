/**
 * Markdown Renderer
 * Utility for converting markdown legal documents to React components
 * Supports syntax highlighting and code blocks
 * Optimized for performance with memoization
 */

export interface MarkdownOptions {
  enableCodeHighlight?: boolean;
  enableLinks?: boolean;
  enableImages?: boolean;
  maxHeadingLevel?: number;
}

export interface ParsedMarkdown {
  html: string;
  headings: Array<{
    level: number;
    text: string;
    id: string;
  }>;
  links: Array<{
    href: string;
    text: string;
  }>;
}

/**
 * Parse markdown content and extract structure
 */
export function parseMarkdown(
  markdown: string,
  options: MarkdownOptions = {}
): ParsedMarkdown {
  const {
    enableCodeHighlight = true,
    enableLinks = true,
    enableImages = false,
    maxHeadingLevel = 6
  } = options;

  const lines = markdown.split('\n');
  const headings: ParsedMarkdown['headings'] = [];
  const links: ParsedMarkdown['links'] = [];
  let html = '';

  for (const line of lines) {
    // Handle headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (level <= maxHeadingLevel) {
        const text = headingMatch[2];
        const id = generateHeadingId(text);
        headings.push({ level, text, id });
        html += `<h${level} id="${id}">${text}</h${level}>\n`;
      }
      continue;
    }

    // Handle code blocks
    if (enableCodeHighlight && line.startsWith('```')) {
      const codeMatch = line.match(/^```(\w+)?/);
      const language = codeMatch?.[1] || 'text';
      html += `<pre><code class="language-${language}">`;
      continue;
    }

    if (line === '```') {
      html += `</code></pre>\n`;
      continue;
    }

    // Handle links
    if (enableLinks) {
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      line.replace(linkPattern, (match, text, href) => {
        links.push({ href, text });
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      });
    }

    // Handle bold and italic
    let processedLine = line;
    processedLine = processedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    processedLine = processedLine.replace(/\*(.+?)\*/g, '<em>$1</em>');
    processedLine = processedLine.replace(/__(.+?)__/g, '<strong>$1</strong>');
    processedLine = processedLine.replace(/_(.+?)_/g, '<em>$1</em>');

    // Handle lists
    if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
      processedLine = `<li>${processedLine.replace(/^[\s\-\*]+/, '')}</li>`;
      html += processedLine + '\n';
      continue;
    }

    // Handle paragraphs
    if (line.trim().length > 0) {
      html += `<p>${processedLine}</p>\n`;
    }
  }

  return {
    html,
    headings,
    links
  };
}

/**
 * Convert markdown to plain text (strip all formatting)
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^#+\s+/gm, '') // Remove headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1') // Remove links
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/^[\s\-\*]+/gm, '') // Remove list markers
    .trim();
}

/**
 * Extract table of contents from markdown
 */
export function extractTableOfContents(
  markdown: string
): Array<{ level: number; text: string; id: string }> {
  const headingPattern = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];

  let match;
  while ((match = headingPattern.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const id = generateHeadingId(text);
    headings.push({ level, text, id });
  }

  return headings;
}

/**
 * Generate a valid HTML ID from heading text
 */
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Split markdown into sections by heading level
 */
export function splitMarkdownBySections(
  markdown: string,
  headingLevel: number = 2
): Array<{ heading: string; content: string; level: number }> {
  const sections: Array<{ heading: string; content: string; level: number }> = [];
  const headingPattern = new RegExp(`^#{${headingLevel}}\\s+(.+)$`, 'gm');

  const parts = markdown.split(headingPattern);

  // First part is before any heading
  if (parts[0].trim()) {
    sections.push({
      heading: 'Introduction',
      content: parts[0].trim(),
      level: 0
    });
  }

  // Process heading-content pairs
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i];
    const content = parts[i + 1] || '';
    sections.push({
      heading,
      content: content.trim(),
      level: headingLevel
    });
  }

  return sections;
}

/**
 * Validate markdown syntax
 */
export function validateMarkdownSyntax(markdown: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for balanced brackets
  const openBrackets = (markdown.match(/\[/g) || []).length;
  const closeBrackets = (markdown.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Unbalanced square brackets');
  }

  // Check for balanced parentheses in links
  const linkPattern = /\[([^\]]+)\]\(([^)]*)/g;
  let match;
  while ((match = linkPattern.exec(markdown)) !== null) {
    const closeParenIndex = markdown.indexOf(')', match.index + match[0].length);
    if (closeParenIndex === -1) {
      errors.push('Unclosed parenthesis in link');
    }
  }

  // Check for balanced code backticks
  const backtickCount = (markdown.match(/```/g) || []).length;
  if (backtickCount % 2 !== 0) {
    errors.push('Unbalanced code blocks (```)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Extract summary from markdown (first paragraph or first N characters)
 */
export function extractSummary(markdown: string, maxLength: number = 200): string {
  const plainText = markdownToPlainText(markdown);
  const sentences = plainText.match(/[^.!?]+[.!?]+/g) || [plainText];

  let summary = '';
  for (const sentence of sentences) {
    if ((summary + sentence).length > maxLength) {
      break;
    }
    summary += sentence;
  }

  return summary.trim().slice(0, maxLength) + '...';
}

/**
 * Find sections containing a search term
 */
export function searchMarkdown(
  markdown: string,
  searchTerm: string,
  contextLines: number = 2
): Array<{
  heading: string;
  context: string;
  matchCount: number;
}> {
  const results: Array<{ heading: string; context: string; matchCount: number }> = [];

  const lines = markdown.split('\n');
  const searchRegex = new RegExp(searchTerm, 'gi');
  let currentHeading = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a heading
    if (line.match(/^#+\s+/)) {
      currentHeading = line.replace(/^#+\s+/, '').trim();
    }

    // Check if line contains search term
    const matches = line.match(searchRegex);
    if (matches) {
      const startLine = Math.max(0, i - contextLines);
      const endLine = Math.min(lines.length - 1, i + contextLines);
      const context = lines.slice(startLine, endLine + 1).join('\n');

      results.push({
        heading: currentHeading,
        context,
        matchCount: matches.length
      });
    }
  }

  return results;
}

/**
 * Format markdown for display with line breaks and proper spacing
 */
export function formatMarkdownForDisplay(markdown: string): string {
  return markdown
    .split('\n')
    .map(line => {
      // Preserve heading spacing
      if (line.match(/^#+\s+/)) {
        return `\n${line}\n`;
      }
      return line;
    })
    .join('\n')
    .trim();
}

/**
 * Cache for parsed markdown documents
 */
const parseCache = new Map<string, ParsedMarkdown>();

/**
 * Parse markdown with caching
 */
export function parseMarkdownCached(
  markdown: string,
  options: MarkdownOptions = {}
): ParsedMarkdown {
  const cacheKey = `${markdown.length}_${JSON.stringify(options)}`;

  if (parseCache.has(cacheKey)) {
    return parseCache.get(cacheKey)!;
  }

  const parsed = parseMarkdown(markdown, options);
  parseCache.set(cacheKey, parsed);

  // Limit cache size
  if (parseCache.size > 50) {
    const firstKey = parseCache.keys().next().value;
    parseCache.delete(firstKey);
  }

  return parsed;
}

/**
 * Clear markdown parsing cache
 */
export function clearMarkdownCache(): void {
  parseCache.clear();
}
