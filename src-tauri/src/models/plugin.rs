use serde::{Deserialize, Serialize};

/// Represents a local plugin's manifest.json metadata.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    #[serde(default)]
    pub enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub homepage: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permissions: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub main: Option<String>,
}

/// Represents a remote plugin available in the BerryUIKI/Taleno-Plugins registry.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RemotePlugin {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repository: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub homepage: Option<String>,
    #[serde(default = "default_entry_file")]
    pub entry_file: String,
    pub raw_base_url: String,
    #[serde(
        skip_serializing_if = "Option::is_none",
        alias = "minLexoraVersion",
        alias = "min_lexora_version"
    )]
    pub min_taleno_version: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub permissions: Vec<String>,
}

fn default_entry_file() -> String {
    "main.js".to_string()
}

/// The structure of plugins.json returned by the registry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginRegistryResponse {
    #[serde(default)]
    pub version: u32,
    #[serde(default)]
    pub last_updated: String,
    #[serde(default)]
    pub plugins: Vec<RemotePlugin>,
}
