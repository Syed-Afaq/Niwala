import fs from 'fs';
import path from 'path';

/**
 * Uploaded images live on local disk and are served as static files.
 * Only the public path (e.g. /uploads/abc.jpg) is stored in the database.
 */
/**
 * The backend folder, found by walking up to its package.json. __dirname alone
 * is not enough: it is src/lib under ts-node but dist/src/lib after a build,
 * which would put uploads in two different places.
 */
function findBackendRoot(start: string): string {
  let dir = start;
  while (!fs.existsSync(path.join(dir, 'package.json'))) {
    const parent = path.dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
  return dir;
}

export const UPLOADS_DIR = path.join(findBackendRoot(__dirname), 'uploads');
export const UPLOADS_ROUTE = '/uploads';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Accepted types, and the extension each is saved with. */
export const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Matches only paths this server generated. Restaurants and meals may not
 * point at arbitrary external URLs.
 */
export const UPLOADED_IMAGE_PATH = /^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/**
 * Checks the first bytes of a saved file really are the image type claimed.
 * The declared content type comes from the client and cannot be trusted alone.
 */
export function hasImageSignature(filePath: string, mimetype: string): boolean {
  const fd = fs.openSync(filePath, 'r');
  const head = Buffer.alloc(12);
  try {
    fs.readSync(fd, head, 0, 12, 0);
  } finally {
    fs.closeSync(fd);
  }
  switch (mimetype) {
    case 'image/jpeg':
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case 'image/png':
      return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp':
      return head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP';
    default:
      return false;
  }
}

export function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
