import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadFile, isR2Active } from '../services/r2Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads PDF bytes dynamically from either a local filesystem path or a remote HTTP URL.
 * Supports Cloudflare R2 / S3 URLs and local fallbacks.
 * @param {string} pathOrUrl - File path or HTTP URL
 * @returns {Promise<Buffer>} - File bytes buffer
 */
export const readPdfBytes = async (pathOrUrl) => {
  if (!pathOrUrl) {
    throw new Error('No path or URL provided to readPdfBytes.');
  }

  // Use R2 Secure Download if active
  if (isR2Active()) {
    try {
      console.log(`[File Loader] Fetching resource via StorageService download: ${pathOrUrl}`);
      return await downloadFile(pathOrUrl);
    } catch (r2Err) {
      console.warn(`[File Loader] StorageService download failed, trying standard fetch/fs fallback:`, r2Err.message);
    }
  }

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    console.log(`[File Loader] Fetching remote resource: ${pathOrUrl}`);
    const res = await fetch(pathOrUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch remote file from URL: ${pathOrUrl} (Status ${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Resolve local path
  let resolvedPath = pathOrUrl;
  
  if (!path.isAbsolute(resolvedPath)) {
    // If it's an uploads path and we are in production with Railway Volume
    if (resolvedPath.startsWith('uploads/') && fs.existsSync('/data')) {
      resolvedPath = path.join('/data', resolvedPath);
    } else {
      // If running from backend directory vs root directory
      resolvedPath = path.resolve(resolvedPath);
      if (!fs.existsSync(resolvedPath)) {
        // Try resolving relative to backend directory if not found in cwd
        resolvedPath = path.join(__dirname, '..', pathOrUrl);
      }
    }
  }

  console.log(`[File Loader] Reading local resource: ${resolvedPath}`);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Local file not found at path: ${resolvedPath}`);
  }

  return fs.readFileSync(resolvedPath);
};
