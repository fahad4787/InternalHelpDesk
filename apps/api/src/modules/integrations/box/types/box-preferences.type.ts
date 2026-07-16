export interface BoxPreferences {
  showFiles: boolean;
}

export const DEFAULT_BOX_PREFERENCES: BoxPreferences = {
  showFiles: true,
};

export interface BoxFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedAt: string;
  webViewLink: string | null;
  isFolder: boolean;
}
