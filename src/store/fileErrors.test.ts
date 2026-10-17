import { describe, it, expect, beforeEach } from "vitest";
import {
  fileError,
  reportFileError,
  clearFileError,
} from "./fileErrors";

describe("File Errors Store (#104)", () => {
  beforeEach(() => {
    clearFileError();
  });

  it("reports and clears file operation errors", () => {
    expect(fileError()).toBeNull();

    reportFileError({
      type: "save",
      message: "Permission denied while writing to disk",
      path: "/docs/test.md",
      canRetry: true,
    });

    const err = fileError();
    expect(err).not.toBeNull();
    expect(err?.type).toBe("save");
    expect(err?.message).toBe("Permission denied while writing to disk");
    expect(err?.path).toBe("/docs/test.md");
    expect(err?.canRetry).toBe(true);

    clearFileError();
    expect(fileError()).toBeNull();
  });

  it("supports various file operation error types", () => {
    reportFileError({
      type: "open",
      message: "File not found",
      path: "/docs/missing.md",
    });
    expect(fileError()?.type).toBe("open");

    reportFileError({
      type: "rename",
      message: "Target name already exists",
      path: "/docs/old.md",
      targetPath: "/docs/new.md",
    });
    expect(fileError()?.type).toBe("rename");
    expect(fileError()?.targetPath).toBe("/docs/new.md");

    reportFileError({
      type: "export",
      message: "HTML export failed",
    });
    expect(fileError()?.type).toBe("export");
  });
});
