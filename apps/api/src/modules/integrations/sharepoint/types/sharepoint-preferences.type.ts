export interface SharePointPreferences {
  showSites: boolean;
}

export const DEFAULT_SHAREPOINT_PREFERENCES: SharePointPreferences = {
  showSites: true,
};

export interface SharePointSite {
  id: string;
  name: string;
  webUrl: string | null;
  description: string | null;
}
