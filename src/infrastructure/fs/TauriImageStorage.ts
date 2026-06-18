import { exists, mkdir, copyFile, remove, BaseDirectory } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { ImageStorage } from "../../application/ports/ImageStorage";
import { buildStoredImageFileName, IMAGES_DIR_NAME } from "./imagePaths";

/**
 * Tauri-backed `ImageStorage` using plugin-fs (`copyFile`/`remove`/`mkdir`)
 * and the asset protocol (`convertFileSrc`) for webview rendering.
 *
 * IPC-bound: every method calls into the Tauri/Rust backend
 * (`invoke('plugin:fs|...')` under the hood) and CANNOT be exercised by
 * headless Vitest. The only pure logic here — building a unique stored
 * file name — is extracted to `imagePaths.ts` and unit-tested there.
 *
 * Manual verification required under `pnpm tauri dev` (see apply-progress
 * for the exact steps — this is the Phase 1 task 1.5 smoke test).
 *
 * Depends on the coordinated 3-way allowlist already configured:
 * - `tauri.conf.json`: CSP `img-src 'self' asset: http://asset.localhost`,
 *   `assetProtocol.scope: ["$APPDATA/habit-images/*"]`
 * - `capabilities/default.json`: `fs:allow-copy-file` and `fs:allow-mkdir`
 *   scoped to `$APPDATA/habit-images*`
 */
export class TauriImageStorage implements ImageStorage {
  async copy(sourcePath: string): Promise<string> {
    const dirExists = await exists(IMAGES_DIR_NAME, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) {
      await mkdir(IMAGES_DIR_NAME, { baseDir: BaseDirectory.AppData });
    }

    const fileName = buildStoredImageFileName(sourcePath);
    const relativeTarget = `${IMAGES_DIR_NAME}/${fileName}`;

    await copyFile(sourcePath, relativeTarget, {
      toPathBaseDir: BaseDirectory.AppData,
    });

    const appData = await appDataDir();
    return join(appData, IMAGES_DIR_NAME, fileName);
  }

  async delete(imagePath: string): Promise<void> {
    await remove(imagePath);
  }
}

/**
 * Opens the native file picker restricted to image files and returns the
 * selected absolute path, or `null` if the user cancelled. This is the
 * picking step that precedes `ImageStorage.copy` — kept separate from the
 * port because picking is a UI-triggered action, not a storage concern.
 */
export async function pickImage(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] },
    ],
  });

  return selected ?? null;
}

/**
 * Converts a stored managed image path (as returned by
 * `TauriImageStorage.copy`) into a URL the webview can render in an
 * `<img src>`, via Tauri's asset protocol. Requires the path to fall under
 * `assetProtocol.scope` configured in `tauri.conf.json` — otherwise the
 * image fails to load SILENTLY (no console error in some Tauri versions),
 * which is exactly the footgun the Phase 1.5 manual smoke test must catch.
 */
export function toRenderableImageUrl(storedImagePath: string): string {
  return convertFileSrc(storedImagePath);
}
