import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

let s3Client = null;
const bucketName = process.env.R2_BUCKET_NAME;
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const customDomain = process.env.R2_PUBLIC_CUSTOM_DOMAIN; // e.g. https://pub-xxx.r2.dev

const isConfigured = bucketName && accountId && accessKeyId && secretAccessKey;

if (isConfigured) {
  try {
    s3Client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    console.log('[Storage Service] Cloudflare R2 storage initialized successfully.');
  } catch (err) {
    console.error('[Storage Service] Failed to initialize S3Client for R2:', err.message);
  }
} else {
  console.warn('[Storage Service] R2 credentials not fully set — falling back to local storage.');
}

/**
 * Upload a local file to Cloudflare R2
 * @param {string} localFilePath - Path to local file on disk
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type (e.g. application/pdf)
 * @returns {Promise<string>} - Publicly accessible URL of the file
 */
export const uploadToR2 = async (localFilePath, originalName, mimeType = 'application/pdf') => {
  if (!s3Client || !bucketName) {
    console.log('[Storage Service] R2 not active — using local file path fallback.');
    // Return path relative to server root
    return localFilePath.replace(/\\/g, '/');
  }

  try {
    const fileBuffer = fs.readFileSync(localFilePath);
    const fileKey = `uploads/${Date.now()}-${path.basename(originalName)}`;
    
    console.log(`[Storage Service] Uploading ${originalName} to R2 bucket ${bucketName}...`);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
    }));
    
    console.log(`[Storage Service] Upload successful. Key: ${fileKey}`);

    // Generate public URL
    if (customDomain) {
      return `${customDomain.replace(/\/$/, '')}/${fileKey}`;
    }
    // Standard R2 public endpoint endpoint (if bucket is public)
    return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`;
  } catch (err) {
    console.error('[Storage Service] Cloudflare R2 Upload failed:', err.message);
    // Fall back to local path rather than crashing the upload request
    return localFilePath.replace(/\\/g, '/');
  }
};

/**
 * Delete a file from Cloudflare R2
 * @param {string} fileUrlOrKey - Full URL or key of the file
 */
export const deleteFromR2 = async (fileUrlOrKey) => {
  if (!s3Client || !bucketName) return;

  try {
    let fileKey = fileUrlOrKey;
    if (fileUrlOrKey.includes('r2.cloudflarestorage.com/')) {
      fileKey = fileUrlOrKey.split('r2.cloudflarestorage.com/')[1];
    } else if (customDomain && fileUrlOrKey.includes(customDomain)) {
      fileKey = fileUrlOrKey.split(customDomain)[1].replace(/^\//, '');
    }

    console.log(`[Storage Service] Deleting key: ${fileKey} from R2...`);

    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    }));
    
    console.log('[Storage Service] Deletion successful.');
  } catch (err) {
    console.error('[Storage Service] Cloudflare R2 deletion failed:', err.message);
  }
};

export const isR2Active = () => !!s3Client;
