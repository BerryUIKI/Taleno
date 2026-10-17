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
  onSaveFile?: () => void;
  onSaveFileAs?: () => void;
  onCloseWindow?: () => void;
  onOpenQuickSwitcher: () => void;
}

export const MobileShell: Component<MobileShellProps> = (props) => {
  const [activeSheet, setActiveSheet] = createSignal<MobileSheetView>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = createSignal(false);
  const [viewportHeight, setViewportHeight] = createSignal<number | null>(null);
  const [viewportOffsetTop, setViewportOffsetTop] = createSignal<number>(0);

  // Track virtual keyboard visibility and geometry via visualViewport API
  const updateViewportGeometry = () => {
    if (typeof window !== "undefined" && window.visualViewport) {
      const vv = window.visualViewport;
      const isKeyboard = vv.height < window.innerHeight * 0.75;
      setIsKeyboardVisible(isKeyboard);
      setViewportHeight(vv.height);
      setViewportOffsetTop(vv.offsetTop || 0);
    }
  };

  onMount(() => {
    if (typeof window !== "undefined" && window.visualViewport) {
      updateViewportGeometry();
      window.visualViewport.addEventListener("resize", updateViewportGeometry);
      window.visualViewport.addEventListener("scroll", updateViewportGeometry);
    }
  });

  onCleanup(() => {
    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.removeEventListener("resize", updateViewportGeometry);
      window.visualViewport.removeEventListener("scroll", updateViewportGeometry);
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
      class="w-screen flex flex-col overflow-hidden relative"
      style={{
        height: viewportHeight() !== null ? `${viewportHeight()}px` : "100vh",
        transform: viewportOffsetTop() > 0 ? `translateY(${viewportOffsetTop()}px)` : undefined,
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
      }}
      data-testid="mobile-shell"
    >
      {/* 1. Mobile Safe-Area Top Bar */}
      <MobileTopBar
        onOpenFiles={() => setActiveSheet("files")}
        onOpenOutline={() => setActiveSheet("outline")}
        onOpenSettings={() => setActiveSheet("settings")}
        onNewDocument={props.onNewDocument}
        onSaveFile={props.onSaveFile}
        onSaveFileAs={props.onSaveFileAs}
        onCloseWindow={props.onCloseWindow}
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
        view={activeSheet()}
        onClose={() => setActiveSheet(null)}
        onOpenFile={props.onOpenFile}
        onNewDocument={props.onNewDocument}
        onSaveFile={props.onSaveFile}
        onSaveFileAs={props.onSaveFileAs}
      />
    </div>
  );
};
