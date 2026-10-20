import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "./constants";

type AllowedType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** Detects the real image type from the file's first bytes, ignoring the browser-supplied MIME type. */
export function sniffImageType(bytes: Uint8Array): AllowedType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export type ImageCheck =
  | { ok: true; image: { fileName: string; mimeType: AllowedType; bytes: Uint8Array } | null }
  | { ok: false; error: string };

/**
 * Validates an optional uploaded photo: size limit, declared type and actual file signature
 * must all agree. Anything else (SVG, PDF, executables renamed to .jpg …) is rejected.
 */
export async function validateImageUpload(file: FormDataEntryValue | null): Promise<ImageCheck> {
  if (!file || typeof file === "string" || file.size === 0) return { ok: true, image: null };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Photos must be 2 MB or smaller." };
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG or WebP photos are allowed." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = sniffImageType(bytes);
  if (!detected || detected !== file.type) {
    return { ok: false, error: "That file is not a valid JPEG, PNG or WebP image." };
  }
  const safeName = (file.name || "photo").replace(/[^\w.\- ]+/g, "_").slice(0, 100);
  return { ok: true, image: { fileName: safeName, mimeType: detected, bytes } };
}
