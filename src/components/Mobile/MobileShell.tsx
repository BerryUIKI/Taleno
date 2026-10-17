import { Component, createSignal, Show, onMount, onCleanup, JSX } from "solid-js";
import { displayMode } from "../../store/editor";
import { MobileTopBar } from "./MobileTopBar";
import { MobileBottomNav, MobileSheetView } from "./MobileBottomNav";
import { MobileFormatBar } from "./MobileFormatBar";
import { MobileDrawerSheet } from "./MobileDrawerSheet";

interface MobileShellProps {
  children: JSX.Element;
  onOpenFile: (path: string) => Promise<void>;
  onNewDocument: () => void;
  onOpenQuickSwitcher: () => void;
  onCloseTab?: (id: string) => void;
}

export const MobileShell: Component<MobileShellProps> = (props) => {
  const [activeSheet, setActiveSheet] = createSignal<MobileSheetView>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = createSignal(false);

  // Track virtual keyboard visibility via visualViewport API
  const handleViewportResize = () => {
    if (typeof window !== "undefined" && window.visualViewport) {
      const isKeyboard = window.visualViewport.height < window.innerHeight * 0.75;
      setIsKeyboardVisible(isKeyboard);
    }
  };

  onMount(() => {
    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportResize);
    }
  });

  onCleanup(() => {
    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.removeEventListener("resize", handleViewportResize);
    }
  });

  const handleToggleSheet = (view: MobileSheetView) => {
    if (view === "search") {
      props.onOpenQuickSwitcher();
      setActiveSheet(null);
    } else {
      setActiveSheet(view);
    }
  };

  return (
    <div
      class="h-screen w-screen flex flex-col overflow-hidden relative"
      style={{
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* 1. Mobile Safe-Area Top Bar */}
      <MobileTopBar
        onOpenFiles={() => setActiveSheet("files")}
        onOpenOutline={() => setActiveSheet("outline")}
        onOpenSettings={() => setActiveSheet("settings")}
        onNewDocument={props.onNewDocument}
      />

      {/* 2. Main Document Content Viewport */}
      <main class="flex-1 min-h-0 overflow-y-auto relative flex flex-col">
        {props.children}
      </main>

      {/* 3. Bottom Context Bar (Switches between Format Toolbelt and Bottom Nav) */}
      <Show
        when={displayMode() === "writing" && isKeyboardVisible()}
        fallback={
          <MobileBottomNav
            activeSheet={activeSheet()}
            onToggleSheet={handleToggleSheet}
          />
        }
      >
        <MobileFormatBar
          onCloseKeyboard={() => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }}
        />
      </Show>

      {/* 4. Bottom Sheet Modal (Files / Outline / Settings) */}
      <MobileDrawerSheet
        onCloseTab={props.onCloseTab}
        view={activeSheet()}
        onClose={() => setActiveSheet(null)}
        onOpenFile={props.onOpenFile}
        onNewDocument={props.onNewDocument}
      />
    </div>
  );
};
