/**
 * Utility functions for handling Drag and Drop of files in Taleno.
 */

export const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "bmp",
  "ico",
  "tiff",
  "avif",
]);

/**
 * Extracts the file basename from a full path (supports Windows \\ and POSIX /).
 */
export function getFileName(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1] || filePath;
}

/**
 * Returns true if the file path has an image extension.
 */
export function isImageFile(filePath: string): boolean {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Creates a Markdown link string for a dropped file.
 * Returns `![filename](path)` for images, `[filename](path)` for other files.
 */
export function createMarkdownLink(filePath: string): string {
  const filename = getFileName(filePath);
  // Normalize Windows backslashes in URL/path if needed
  const normalizedPath = filePath.replace(/\\/g, "/");

  if (isImageFile(filePath)) {
    return `![${filename}](${normalizedPath})`;
  }
  return `[${filename}](${normalizedPath})`;
}

/**
 * Determines whether a drop position targets the TabBar or the Text Viewport.
 */
export function isDropOverTabBar(
  physicalPos: { x: number; y: number },
  tabBarElement: HTMLElement | null,
  devicePixelRatio: number = 1
): boolean {
  if (!tabBarElement) return false;

  const logicalX = physicalPos.x / devicePixelRatio;
  const logicalY = physicalPos.y / devicePixelRatio;

  const rect = tabBarElement.getBoundingClientRect();
  return (
    logicalX >= rect.left &&
    logicalX <= rect.right &&
    logicalY >= rect.top &&
    logicalY <= rect.bottom
  );
}

/**
 * Dispatches file drop action according to requirements:
 * 1. If no file is open -> opens the file.
 * 2. If a file is open:
 *    - Dropped on TabBar -> opens the file.
 *    - Dropped on Text Area -> inserts Markdown link.
 */
export async function processFileDrop({
  paths,
  isTabBar,
  hasOpenDocument,
  onOpenFile,
  onInsertLinks,
}: {
  paths: string[];
  isTabBar: boolean;
  hasOpenDocument: boolean;
  onOpenFile: (path: string) => Promise<void> | void;
  onInsertLinks: (markdownLinks: string) => void;
}): Promise<void> {
  if (paths.length === 0) return;

  if (!hasOpenDocument || isTabBar) {
    // Open the files
    for (const path of paths) {
      await onOpenFile(path);
    }
  } else {
    // Insert links into current document text
    const links = paths.map((p) => createMarkdownLink(p)).join("\n");
    onInsertLinks(links);
  }
}
