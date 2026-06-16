export interface ParsedSection {
  heading: string;
  body: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
}

export interface DocContext {
  title: string;
  description: string;
  sections: string[];
}

export function sectionToReadable(section: string): string {
  const cleaned = section.replace(/^\d+\.\s+/, '').trim().toLowerCase();
  if (!cleaned) return section;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function extractDocumentTitle(text: string): string {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && trimmed.length < 160) return trimmed;
  }
  return 'Uploaded document';
}

export function inferDocumentDescription(title: string): string {
  const cleaned = title.replace(/\([^)]*\)/g, '').trim();
  for (const sep of ['—', ' - ', ' – ']) {
    if (cleaned.includes(sep)) {
      const right = cleaned.split(sep).slice(1).join(sep).trim();
      if (right) return right.charAt(0).toLowerCase() + right.slice(1);
    }
  }
  return cleaned ? cleaned.charAt(0).toLowerCase() + cleaned.slice(1) : 'this document';
}

export function parseSections(
  text: string,
  meta: { documentId: string; documentTitle: string; chunkIndex: number },
): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const pattern = /=+\s*\n(\d+\.\s+[^\n]+)\s*\n=+\s*\n([\s\S]*?)(?=\n=+\s*\n\d+\.\s+|$)/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    sections.push({
      heading: match[1].trim(),
      body: match[2].trim(),
      ...meta,
    });
  }

  if (sections.length > 0) return sections;

  const fallbackPattern = /(\d+\.\s+[A-Z][^\n]*)\n([\s\S]*?)(?=\n\d+\.\s+[A-Z]|$)/g;
  while ((match = fallbackPattern.exec(text)) !== null) {
    const body = match[2].trim();
    if (body.length > 20) {
      sections.push({ heading: match[1].trim(), body, ...meta });
    }
  }

  if (sections.length > 0) return sections;

  const trimmed = text.trim();
  if (trimmed.length > 40) {
    sections.push({ heading: '', body: trimmed, ...meta });
  }

  return sections;
}

export function parseAllSections(
  chunks: {
    content: string;
    chunkIndex: number;
    document: { id: string; title: string };
  }[],
): ParsedSection[] {
  const all: ParsedSection[] = [];
  for (const chunk of chunks) {
    all.push(
      ...parseSections(chunk.content, {
        documentId: chunk.document.id,
        documentTitle: chunk.document.title,
        chunkIndex: chunk.chunkIndex,
      }),
    );
  }
  return all;
}

export function buildDocumentContext(sections: ParsedSection[]): DocContext {
  if (sections.length === 0) {
    return { title: '', description: '', sections: [] };
  }

  const title = sections[0].documentTitle || 'Uploaded document';
  const headingList: string[] = [];
  const seen = new Set<string>();

  for (const section of sections) {
    if (section.heading) {
      const key = section.heading.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        headingList.push(section.heading);
      }
    }
  }

  return {
    title,
    description: inferDocumentDescription(title),
    sections: headingList,
  };
}

export function sectionHeadingText(section: ParsedSection): string {
  return section.heading.replace(/^\d+\.\s+/, '').trim();
}
