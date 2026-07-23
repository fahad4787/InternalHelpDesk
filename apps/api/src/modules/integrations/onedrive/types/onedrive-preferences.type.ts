export interface OneDrivePreferences {
  showFiles: boolean;
}

export const DEFAULT_ONEDRIVE_PREFERENCES: OneDrivePreferences = {
  showFiles: true,
};

export interface OneDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  modifiedAt: string;
  webViewLink: string | null;
  isFolder: boolean;
}
