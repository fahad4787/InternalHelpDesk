const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

function splitBySections(text: string): string[] {
  const lines = text.split('\n');
  const sections: string[] = [];
  let current: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isDivider = /^={3,}$/.test(line.trim());
    const nextLine = lines[i + 1]?.trim() ?? '';
    const isSectionStart = isDivider && /^\d+\.\s+/.test(nextLine);

    if (isSectionStart && current.length > 0) {
      sections.push(current.join('\n').trim());
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    sections.push(current.join('\n').trim());
  }

  return sections.filter((s) => s.length > 20);
}

function chunkByWords(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length);
    chunks.push(words.slice(start, end).join(' '));
    if (end >= words.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

export function chunkText(text: string): string[] {
  const sections = splitBySections(text);

  if (sections.length > 1) {
    const chunks: string[] = [];
    let buffer = '';

    for (const section of sections) {
      const sectionWords = section.split(/\s+/).filter(Boolean).length;
      const bufferWords = buffer ? buffer.split(/\s+/).filter(Boolean).length : 0;

      if (buffer && bufferWords + sectionWords > CHUNK_SIZE) {
        chunks.push(buffer.trim());
        buffer = section;
      } else {
        buffer = buffer ? `${buffer}\n\n${section}` : section;
      }
    }

    if (buffer.trim()) {
      chunks.push(buffer.trim());
    }

    return chunks;
  }

  return chunkByWords(text);
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
}
