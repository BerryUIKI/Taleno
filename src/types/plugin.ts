export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  homepage?: string;
  permissions?: string[];
  tags?: string[];
  main?: string;
}

export interface RemotePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  repository?: string;
  homepage?: string;
  entryFile: string;
  rawBaseUrl: string;
  minTalenoVersion?: string;
  tags: string[];
  permissions: string[];
}

export type SettingsTabId = "theme" | "plugins" | "updates";
export type PluginSubTabId = "installed" | "marketplace";
