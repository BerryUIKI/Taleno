import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CloseConfirmModal } from "./CloseConfirmModal";

describe("CloseConfirmModal", () => {
  let dispose: (() => void) | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    container?.remove();
    container = undefined;
  });

  it("renders when open and displays the target filename", () => {
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <CloseConfirmModal
          isOpen={true}
          filename="MyDraft.md"
          onSave={vi.fn()}
          onDiscard={vi.fn()}
          onCancel={vi.fn()}
        />
      ),
      container
    );

    const dialog = container.querySelector<HTMLDivElement>('[data-modal="close-confirm"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain("MyDraft.md");
  });

  it("triggers onSave when save button is clicked", () => {
    const onSave = vi.fn();
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <CloseConfirmModal
          isOpen={true}
          filename="Untitled.md"
          onSave={onSave}
          onDiscard={vi.fn()}
          onCancel={vi.fn()}
        />
      ),
      container
    );

    const saveBtn = container.querySelector<HTMLButtonElement>('[data-action="save"]');
    expect(saveBtn).toBeTruthy();
    saveBtn?.click();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("triggers onDiscard when don't save button is clicked", () => {
    const onDiscard = vi.fn();
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <CloseConfirmModal
          isOpen={true}
          filename="Untitled.md"
          onSave={vi.fn()}
          onDiscard={onDiscard}
          onCancel={vi.fn()}
        />
      ),
      container
    );

    const discardBtn = container.querySelector<HTMLButtonElement>('[data-action="discard"]');
    expect(discardBtn).toBeTruthy();
    discardBtn?.click();
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("triggers onCancel when cancel button or backdrop is clicked", () => {
    const onCancel = vi.fn();
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <CloseConfirmModal
          isOpen={true}
          filename="Untitled.md"
          onSave={vi.fn()}
          onDiscard={vi.fn()}
          onCancel={onCancel}
        />
      ),
      container
    );

    const cancelBtn = container.querySelector<HTMLButtonElement>('[data-action="cancel"]');
    expect(cancelBtn).toBeTruthy();
    cancelBtn?.click();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard shortcuts Escape and Enter", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <CloseConfirmModal
          isOpen={true}
          filename="Untitled.md"
          onSave={onSave}
          onDiscard={vi.fn()}
          onCancel={onCancel}
        />
      ),
      container
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onSave).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not trigger discard on bare 'd' key", () => {
    const onDiscard = vi.fn();
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <CloseConfirmModal
          isOpen={true}
          filename="Untitled.md"
          onSave={vi.fn()}
          onDiscard={onDiscard}
          onCancel={vi.fn()}
        />
      ),
      container
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    expect(onDiscard).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "D" }));
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it("triggers discard on Alt+D or Cmd+D", () => {
    const onDiscard = vi.fn();
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <CloseConfirmModal
          isOpen={true}
          filename="Untitled.md"
          onSave={vi.fn()}
          onDiscard={onDiscard}
          onCancel={vi.fn()}
        />
      ),
      container
    );

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", altKey: true }));
    expect(onDiscard).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", metaKey: true }));
    expect(onDiscard).toHaveBeenCalledTimes(2);
  });

  it("honors the focused action button when Enter is pressed", () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    const onCancel = vi.fn();
    container = document.createElement("div");
    document.body.append(container);

    dispose = render(
      () => (
        <CloseConfirmModal
          isOpen={true}
          filename="Untitled.md"
          onSave={onSave}
          onDiscard={onDiscard}
          onCancel={onCancel}
        />
      ),
      container
    );

    const cancelBtn = container.querySelector<HTMLButtonElement>('[data-action="cancel"]');
    cancelBtn?.focus();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();

    const discardBtn = container.querySelector<HTMLButtonElement>('[data-action="discard"]');
    discardBtn?.focus();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
