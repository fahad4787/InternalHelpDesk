export interface RankedChunk {
  content: string;
  chunkIndex: number;
  document: { id: string; title: string; source?: string };
  score: number;
}

export function rankChunks(
  chunks: {
    content: string;
    chunkIndex: number;
    document: { id: string; title: string; source?: string };
  }[],
  question: string,
  limit = 10,
): RankedChunk[] {
  const terms = question
    .toLowerCase()
    .split(/\W+/)
    .filter((term) => term.length > 2);

  return chunks
    .map((chunk) => {
      const lower = chunk.content.toLowerCase();
      const score = terms.reduce(
        (total, term) => total + (lower.includes(term) ? 1 : 0),
        0,
      );
      return { ...chunk, score };
    })
    .sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex)
    .slice(0, limit);
}
