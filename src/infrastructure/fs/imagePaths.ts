/**
 * Directory name (relative to `$APPDATA`) where habit images are stored.
 * MUST stay in sync with the literal `habit-images` segment used in the
 * coordinated 3-way allowlist: `tauri.conf.json` CSP `img-src` /
 * `assetProtocol.scope`, and `capabilities/default.json`
 * `fs:allow-copy-file` / `fs:allow-mkdir`.
 */
export const IMAGES_DIR_NAME = "habit-images";

/**
 * Builds a unique file name for a copied image, preserving the original
 * extension (lowercased) when present. Pure string logic extracted out of
 * `TauriImageStorage` so it can be unit-tested without touching the
 * filesystem or Tauri IPC.
 */
export function buildStoredImageFileName(sourcePath: string): string {
  const normalized = sourcePath.replace(/\\/g, "/");
  const baseName = normalized.slice(normalized.lastIndexOf("/") + 1);
  const dotIndex = baseName.lastIndexOf(".");
  const extension =
    dotIndex > 0 ? baseName.slice(dotIndex + 1).toLowerCase() : "";

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return extension ? `${unique}.${extension}` : unique;
}
