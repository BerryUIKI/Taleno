use percent_encoding::percent_decode_str;
use std::path::{Path, PathBuf};

/// URI schemes that platform file pickers return instead of filesystem paths.
///
/// Android's Storage Access Framework returns `content://` document URIs, and
/// iOS document pickers return `file://` URLs. Both must stay opaque: they are
/// resolved by platform APIs, never by joining or canonicalizing them as paths.
const DOCUMENT_SCHEMES: [&str; 2] = ["content", "file"];

/// Where a document lives.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DocumentLocation {
    /// A regular filesystem path, as on desktop.
    Path(PathBuf),
    /// A provider URI (`content://` or `file://`) that only platform APIs can read.
    Uri(String),
}

impl DocumentLocation {
    /// Classifies a picker result or stored document identifier.
    ///
    /// Only prefixes are inspected, so a path that merely contains `content://`
    /// later in its name stays a path, and Windows drive letters are not mistaken
    /// for URI schemes.
    pub fn parse(raw: &str) -> Self {
        if has_document_scheme(raw) {
            Self::Uri(raw.to_string())
        } else {
            Self::Path(PathBuf::from(raw))
        }
    }

    pub fn is_uri(&self) -> bool {
        matches!(self, Self::Uri(_))
    }

    /// The filesystem path when this location is a path. `None` means the
    /// location must be resolved through a platform provider.
    pub fn as_path(&self) -> Option<&Path> {
        match self {
            Self::Path(path) => Some(path),
            Self::Uri(_) => None,
        }
    }

    /// The name to show in tabs, the title bar and the status bar.
    ///
    /// Provider URIs carry a document identifier rather than a display name.
    /// Most pickers encode a readable name (`primary%3ADownload%2Fnote.md`
    /// decodes to `primary:Download/note.md`), which yields `note.md`; providers
    /// that use opaque identifiers yield that identifier, and callers fall back
    /// to their own placeholder when this returns `None`.
    pub fn display_name(&self) -> Option<String> {
        match self {
            Self::Path(path) => file_name(path),
            Self::Uri(uri) => uri_display_name(uri),
        }
    }
}

fn has_document_scheme(raw: &str) -> bool {
    DOCUMENT_SCHEMES.iter().any(|scheme| {
        let Some(rest) = raw.get(scheme.len()..) else {
            return false;
        };
        raw.get(..scheme.len())
            .is_some_and(|prefix| prefix.eq_ignore_ascii_case(scheme))
            && rest
                .strip_prefix("://")
                .is_some_and(|tail| !tail.is_empty())
    })
}

fn file_name(path: &Path) -> Option<String> {
    path.file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .filter(|name| !name.is_empty())
}

fn uri_display_name(uri: &str) -> Option<String> {
    let without_fragment = uri.split_once('#').map_or(uri, |(head, _)| head);
    let without_query = without_fragment
        .split_once('?')
        .map_or(without_fragment, |(head, _)| head);
    let last_segment = without_query.rsplit('/').next()?;
    let decoded = percent_decode_str(last_segment).decode_utf8().ok()?;
    // Providers encode separators inside the document id, so the readable name
    // sits after the final separator of the decoded value.
    let name = decoded
        .rsplit('/')
        .next()
        .unwrap_or(decoded.as_ref())
        .trim();
    if name.is_empty() {
        None
    } else {
        Some(name.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_and_windows_paths_stay_paths() {
        assert_eq!(
            DocumentLocation::parse("/home/u/notes/a.md"),
            DocumentLocation::Path(PathBuf::from("/home/u/notes/a.md"))
        );
        assert_eq!(
            DocumentLocation::parse(r"C:\Users\u\notes\a.md"),
            DocumentLocation::Path(PathBuf::from(r"C:\Users\u\notes\a.md"))
        );
        assert!(DocumentLocation::parse("notes/a.md").as_path().is_some());
    }

    #[test]
    fn a_path_that_mentions_a_scheme_is_not_a_uri() {
        let location = DocumentLocation::parse("/tmp/content://notes.md");
        assert!(!location.is_uri());
        assert_eq!(
            location.as_path(),
            Some(Path::new("/tmp/content://notes.md"))
        );
    }

    #[test]
    fn content_and_file_uris_are_recognized_case_insensitively() {
        assert!(
            DocumentLocation::parse(
                "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fa.md"
            )
            .is_uri()
        );
        assert!(DocumentLocation::parse("file:///Users/u/a.md").is_uri());
        assert!(DocumentLocation::parse("CONTENT://provider/document/a.md").is_uri());
        assert!(!DocumentLocation::parse("content:/single-slash").is_uri());
        assert!(!DocumentLocation::parse("content://").is_uri());
    }

    #[test]
    fn display_names_come_from_paths_and_encoded_uri_ids() {
        // `/` separates path segments on every supported desktop platform.
        assert_eq!(
            DocumentLocation::parse("/home/u/notes/today.md").display_name(),
            Some("today.md".to_string())
        );
        assert_eq!(
            DocumentLocation::parse(
                "content://com.android.externalstorage.documents/document/primary%3ADownload%2Ftoday.md"
            )
            .display_name(),
            Some("today.md".to_string())
        );
        assert_eq!(
            DocumentLocation::parse("file:///Users/u/My%20Notes/a%20b.md").display_name(),
            Some("a b.md".to_string())
        );
    }

    #[cfg(windows)]
    #[test]
    fn windows_drive_letters_are_not_uri_schemes() {
        let location = DocumentLocation::parse(r"C:\notes\today.md");
        assert!(!location.is_uri());
        assert_eq!(location.display_name(), Some("today.md".to_string()));
    }

    #[test]
    fn uri_queries_and_fragments_do_not_leak_into_the_name() {
        assert_eq!(
            DocumentLocation::parse(
                "content://provider/document/primary%3ANotes%2Fa.md?mode=rw#top"
            )
            .display_name(),
            Some("a.md".to_string())
        );
    }

    #[test]
    fn opaque_provider_ids_are_returned_as_is() {
        // DownloadsProvider hands out ids, not names; the UI still gets a stable label.
        assert_eq!(
            DocumentLocation::parse(
                "content://com.android.providers.downloads.documents/document/msf%3A1000000123"
            )
            .display_name(),
            Some("msf:1000000123".to_string())
        );
    }

    #[test]
    fn nameless_locations_have_no_display_name() {
        assert_eq!(DocumentLocation::parse("").display_name(), None);
        assert_eq!(
            DocumentLocation::parse("content://provider/document/").display_name(),
            None
        );
        assert_eq!(DocumentLocation::parse("file:///").display_name(), None);
        assert_eq!(
            DocumentLocation::parse("content://provider/document/%20").display_name(),
            None
        );
    }
}
