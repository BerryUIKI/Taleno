import { Component, createSignal, For, Show } from "solid-js";
import type { FileEntry } from "../../lib/tauri/commands";
import { createEntry, deleteEntry, renameEntry } from "../../lib/tauri/commands";
import { reportFileError } from "../../store/fileErrors";
import { t } from "../../i18n";

export interface FileTreeProps {
  tree: FileEntry;
  onSelectFile: (path: string) => void;
  onRefresh: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

interface TreeItemProps {
  entry: FileEntry;
  depth: number;
  onSelectFile: (path: string) => void;
  onRefresh: () => void;
}

const TreeItem: Component<TreeItemProps> = (props) => {
  const [expanded, setExpanded] = createSignal(true);
  const [isEditing, setIsEditing] = createSignal(false);
  const [newName, setNewName] = createSignal(props.entry.name);

  const isMd = () =>
    props.entry.name.endsWith(".md") ||
    props.entry.name.endsWith(".markdown") ||
    props.entry.name.endsWith(".txt");

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (props.entry.is_directory) {
      setExpanded((prev) => !prev);
    } else if (isMd()) {
      props.onSelectFile(props.entry.path);
    }
  };

  const handleRename = async (e: Event) => {
    e.preventDefault();
    if (!newName() || newName() === props.entry.name) {
      setIsEditing(false);
      return;
    }
    const parent = props.entry.path.substring(0, props.entry.path.lastIndexOf(/[/\\]/.exec(props.entry.path)?.[0] || "/"));
    const sep = props.entry.path.includes("\\") ? "\\" : "/";
    const targetPath = `${parent}${sep}${newName()}`;
    try {
      await renameEntry(props.entry.path, targetPath);
      setIsEditing(false);
      props.onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      reportFileError({
        type: "rename",
        message: `Failed to rename ${props.entry.name} to ${newName()}: ${message}`,
        path: props.entry.path,
        targetPath,
      });
      console.error("Failed to rename:", err);
    }
  };

  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation();
    if (confirm(`${t("sidebar.confirmDelete")} (${props.entry.name})`)) {
      try {
        await deleteEntry(props.entry.path);
        props.onRefresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        reportFileError({
          type: "delete",
          message: `Failed to delete ${props.entry.name}: ${message}`,
          path: props.entry.path,
        });
        console.error("Failed to delete entry:", err);
      }
    }
  };

  return (
    <div class="select-none text-xs">
      <div
        class="flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--color-hover)] cursor-pointer group transition-colors"
        style={{ "padding-left": `${0.5 + props.depth * 0.75}rem` }}
        onClick={handleClick}
      >
        <div class="flex items-center gap-1.5 truncate flex-1">
          <Show when={props.entry.is_directory}>
            <span class="opacity-70 text-[10px] w-3 text-center">{expanded() ? "▼" : "▶"}</span>
            <span class="text-sm">📁</span>
          </Show>
          <Show when={!props.entry.is_directory}>
            <span class="w-3" />
            <span class="text-sm">{isMd() ? "📝" : "📄"}</span>
          </Show>

          <Show
            when={!isEditing()}
            fallback={
              <input
                type="text"
                class="bg-[var(--color-bg-primary)] px-1 border border-[var(--color-accent)] rounded outline-none w-32 text-xs"
                value={newName()}
                onInput={(e) => setNewName(e.currentTarget.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === "Enter" && handleRename(e)}
                autofocus
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <span class="truncate font-medium" style={{ color: "var(--color-text-primary)" }}>
              {props.entry.name}
            </span>
          </Show>
        </div>

        {/* Action icons on hover */}
        <div class="hidden group-hover:flex items-center gap-1 opacity-60">
          <button
            class="hover:opacity-100 p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title={t("sidebar.rename")}
          >
            ✏️
          </button>
          <button
            class="hover:opacity-100 p-0.5 text-red-500"
            onClick={handleDelete}
            title={t("sidebar.delete")}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Children */}
      <Show when={props.entry.is_directory && expanded() && props.entry.children}>
        <div>
          <For each={props.entry.children}>
            {(child) => (
              <TreeItem
                entry={child}
                depth={props.depth + 1}
                onSelectFile={props.onSelectFile}
                onRefresh={props.onRefresh}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export const FileTree: Component<FileTreeProps> = (props) => {
  const handleNewFile = async () => {
    const name = prompt("Enter new file name (e.g. note.md):");
    if (!name) return;
    try {
      await createEntry(props.tree.path, name, false);
      props.onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      reportFileError({
        type: "create",
        message: `Failed to create file ${name}: ${message}`,
        path: props.tree.path,
      });
      console.error("Failed to create file:", err);
      alert(`Could not create file. Choose a different name or check folder permissions.\n${String(err)}`);
    }
  };

  const handleNewFolder = async () => {
    const name = prompt("Enter new folder name:");
    if (!name) return;
    try {
      await createEntry(props.tree.path, name, true);
      props.onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      reportFileError({
        type: "create",
        message: `Failed to create folder ${name}: ${message}`,
        path: props.tree.path,
      });
      console.error("Failed to create folder:", err);
      alert(`Could not create folder.\n${String(err)}`);
    }
  };

  return (
    <div class="flex flex-col h-full overflow-hidden">
      {/* Workspace Header Actions */}
      <div
        class="flex items-center justify-between p-2 text-xs"
        style={{
          "border-bottom": props.expanded
            ? "1px solid var(--color-border)"
            : "none",
        }}
      >
        <button
          class="flex items-center gap-1.5 min-w-0 font-semibold text-[var(--color-text-primary)]"
          title={props.tree.path}
          onClick={props.onToggleExpanded}
          aria-expanded={props.expanded}
        >
          <span class="text-[10px] opacity-60">
            {props.expanded ? "▼" : "▶"}
          </span>
          <span class="truncate max-w-28">{t("sidebar.workspace")}</span>
        </button>
        <Show when={props.expanded}>
          <div class="flex items-center gap-1.5">
          <button
            class="p-1 rounded hover:bg-[var(--color-hover)]"
            onClick={handleNewFile}
            title={t("sidebar.newFile")}
          >
            📄+
          </button>
          <button
            class="p-1 rounded hover:bg-[var(--color-hover)]"
            onClick={handleNewFolder}
            title={t("sidebar.newFolder")}
          >
            📁+
          </button>
          <button
            class="p-1 rounded hover:bg-[var(--color-hover)]"
            onClick={props.onRefresh}
            title="Refresh"
          >
            🔄
          </button>
          </div>
        </Show>
      </div>

      {/* Directory Contents */}
      <Show when={props.expanded}>
        <div class="flex-1 overflow-y-auto py-2">
          <Show when={props.tree.children && props.tree.children.length > 0}>
            <For each={props.tree.children}>
              {(child) => (
                <TreeItem
                  entry={child}
                  depth={0}
                  onSelectFile={props.onSelectFile}
                  onRefresh={props.onRefresh}
                />
              )}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  );
};
