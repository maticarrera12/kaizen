import { describe, expect, test } from "vitest";
import { buildStoredImageFileName, IMAGES_DIR_NAME } from "./imagePaths";

describe("buildStoredImageFileName", () => {
  test("keeps the original file extension (lowercased)", () => {
    expect(buildStoredImageFileName("/Users/me/Pictures/Photo.PNG")).toMatch(
      /\.png$/,
    );
  });

  test("supports source paths using backslashes (Windows-style)", () => {
    expect(
      buildStoredImageFileName("C:\\Users\\me\\Pictures\\photo.jpg"),
    ).toMatch(/\.jpg$/);
  });

  test("produces a unique name for two calls on the same source path", () => {
    const a = buildStoredImageFileName("/tmp/a.png");
    const b = buildStoredImageFileName("/tmp/a.png");
    expect(a).not.toBe(b);
  });

  test("falls back to no extension when the source path has none", () => {
    expect(buildStoredImageFileName("/tmp/no-extension-file")).not.toMatch(
      /\.$/,
    );
  });
});

describe("IMAGES_DIR_NAME", () => {
  test("matches the directory name used in the coordinated capability allowlist", () => {
    // tauri.conf.json CSP / assetProtocol.scope and capabilities/default.json
    // fs:allow-copy-file / fs:allow-mkdir all reference $APPDATA/habit-images.
    // This constant MUST stay in sync with that literal string.
    expect(IMAGES_DIR_NAME).toBe("habit-images");
  });
});
