import { readFile } from 'fs/promises';

export async function parseDocumentText(
  filePath: string,
  mimeType: string,
): Promise<string> {
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return readFile(filePath, 'utf-8');
  }

  if (mimeType === 'application/json') {
    const content = await readFile(filePath, 'utf-8');
    return JSON.stringify(JSON.parse(content), null, 2);
  }

  const buffer = await readFile(filePath);
  return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
}
