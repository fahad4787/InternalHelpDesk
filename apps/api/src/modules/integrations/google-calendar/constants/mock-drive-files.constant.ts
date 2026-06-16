export const MOCK_DRIVE_FILES = [
  {
    id: 'mock-drive-1',
    name: 'Employee Handbook 2026.pdf',
    mimeType: 'application/pdf',
    size: 2457600,
    modifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    webViewLink: 'https://drive.google.com',
  },
  {
    id: 'mock-drive-2',
    name: 'Q2 Planning.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 512000,
    modifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    webViewLink: 'https://drive.google.com',
  },
  {
    id: 'mock-drive-3',
    name: 'Team Budget.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 128000,
    modifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    webViewLink: 'https://drive.google.com',
  },
];
