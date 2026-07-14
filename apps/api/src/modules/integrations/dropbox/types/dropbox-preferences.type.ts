export interface DropboxPreferences {
  showFiles: boolean;
}

export const DEFAULT_DROPBOX_PREFERENCES: DropboxPreferences = {
  showFiles: true,
};

export interface DropboxFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedAt: string;
  webViewLink: string | null;
  isFolder: boolean;
}
