import { describe, it, expect, vi } from "vitest";
import {
  dispatchFormat,
  registerWritingFormatter,
  registerCodeFormatter,
  type FormatAction,
} from "./formatter";
import { setDisplayMode } from "../store/editor";

describe("Formatter Dispatcher", () => {
  it("dispatches format action to writing formatter when in writing mode", () => {
    setDisplayMode("writing");
    const writingMock = vi.fn();
    const codeMock = vi.fn();

    registerWritingFormatter(writingMock);
    registerCodeFormatter(codeMock);

    dispatchFormat("bold");
    expect(writingMock).toHaveBeenCalledWith("bold");
    expect(codeMock).not.toHaveBeenCalled();

    dispatchFormat("paragraph");
    expect(writingMock).toHaveBeenCalledWith("paragraph");

    dispatchFormat("link");
    expect(writingMock).toHaveBeenCalledWith("link");

    dispatchFormat("image");
    expect(writingMock).toHaveBeenCalledWith("image");

    dispatchFormat("task_list");
    expect(writingMock).toHaveBeenCalledWith("task_list");

    dispatchFormat("undo");
    expect(writingMock).toHaveBeenCalledWith("undo");

    dispatchFormat("redo");
    expect(writingMock).toHaveBeenCalledWith("redo");

    registerWritingFormatter(null);
    registerCodeFormatter(null);
  });

  it("dispatches format action to code formatter when in code mode", () => {
    setDisplayMode("code");
    const writingMock = vi.fn();
    const codeMock = vi.fn();

    registerWritingFormatter(writingMock);
    registerCodeFormatter(codeMock);

    dispatchFormat("h1");
    expect(codeMock).toHaveBeenCalledWith("h1");
    expect(writingMock).not.toHaveBeenCalled();

    dispatchFormat("italic");
    expect(codeMock).toHaveBeenCalledWith("italic");

    dispatchFormat("undo");
    expect(codeMock).toHaveBeenCalledWith("undo");

    dispatchFormat("redo");
    expect(codeMock).toHaveBeenCalledWith("redo");

    dispatchFormat("task_list");
    expect(codeMock).toHaveBeenCalledWith("task_list");

    registerWritingFormatter(null);
    registerCodeFormatter(null);
  });
});
