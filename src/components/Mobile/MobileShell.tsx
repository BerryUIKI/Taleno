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
  onCloseTab?: (id: string) => void;
}

/**
 * The keyboard is open when the visual viewport has lost a meaningful amount of
 * height compared with the tallest height seen while nothing was focused.
 *
 * A ratio against `window.innerHeight` cannot work: Android's layout viewport
 * resizes with the keyboard, so both values shrink together and the comparison
 * never trips. Comparing against a recorded baseline works in both models,
 * because the visual viewport always shrinks and never grows past its baseline.
 */
const KEYBOARD_MIN_INSET = 80;
let baselineViewportHeight = 0;

function keyboardVisible(visualHeight: number): boolean {
  if (visualHeight > baselineViewportHeight) {
    baselineViewportHeight = visualHeight;
  }
  return baselineViewportHeight - visualHeight > KEYBOARD_MIN_INSET;
}

/** Rotation changes the available height, so the previous maximum no longer applies. */
export function resetViewportBaseline() {
  baselineViewportHeight = 0;
}

export const MobileShell: Component<MobileShellProps> = (props) => {
  const [activeSheet, setActiveSheet] = createSignal<MobileSheetView>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = createSignal(false);
  const [viewportHeight, setViewportHeight] = createSignal<number | null>(null);
  const [viewportOffsetTop, setViewportOffsetTop] = createSignal<number>(0);
  let vv: VisualViewport | null = null;

  // Track virtual keyboard visibility and geometry via visualViewport API
  const updateViewportGeometry = () => {
    if (!vv) return;
    setIsKeyboardVisible(keyboardVisible(vv.height));
    setViewportHeight(vv.height);
    setViewportOffsetTop(vv.offsetTop || 0);
  };

  onMount(() => {
    vv = window.visualViewport ?? null;
    if (vv) {
      updateViewportGeometry();
      vv.addEventListener("resize", updateViewportGeometry);
      vv.addEventListener("scroll", updateViewportGeometry);
    }
    window.addEventListener("orientationchange", handleOrientationChange);
  });

  const handleOrientationChange = () => {
    resetViewportBaseline();
    updateViewportGeometry();
  };

  onCleanup(() => {
    vv?.removeEventListener("resize", updateViewportGeometry);
    vv?.removeEventListener("scroll", updateViewportGeometry);
    window.removeEventListener("orientationchange", handleOrientationChange);
    vv = null;
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
        height: viewportHeight() !== null ? `${viewportHeight()}px` : "100dvh",
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
        onCloseTab={props.onCloseTab}
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
