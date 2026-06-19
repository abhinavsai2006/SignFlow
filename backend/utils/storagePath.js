import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves a key or relative path to the correct local volume path.
 * In production (when /data exists), it uses /data/uploads.
 * In development, it uses backend/uploads.
 * 
 * @param {string} [relativePath] 
 * @returns {string} - Clean absolute local path
 */
export const resolveStoragePath = (relativePath = '') => {
  // Production Railway Volume vs Local Fallback
  const baseDir = fs.existsSync('/data') ? '/data/uploads' : path.resolve(path.join(__dirname, '../uploads'));
  
  if (relativePath) {
    let cleaned = relativePath.replace(/\\/g, '/');
    
    // Remove leading slashes and generic prefix paths
    if (cleaned.startsWith('/')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('data/uploads/')) {
      cleaned = cleaned.substring('data/uploads/'.length);
    } else if (cleaned.startsWith('uploads/')) {
      cleaned = cleaned.substring('uploads/'.length);
    } else if (cleaned.startsWith('app/uploads/')) {
      cleaned = cleaned.substring('app/uploads/'.length);
    }
    
    return path.join(baseDir, cleaned);
  }
  
  return baseDir;
};
