import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
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

export const isR2Active = () => !!s3Client;

/**
 * Upload a local file to Cloudflare R2
 */
export const uploadFile = async (localFilePath, originalName, mimeType = 'application/pdf') => {
  if (!s3Client || !bucketName) {
    console.log('[Storage Service] R2 not active — using local file path fallback.');
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

    if (customDomain) {
      return `${customDomain.replace(/\/$/, '')}/${fileKey}`;
    }
    return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileKey}`;
  } catch (err) {
    console.error('[Storage Service] Cloudflare R2 Upload failed:', err.message);
    return localFilePath.replace(/\\/g, '/');
  }
};

/**
 * Delete a file from Cloudflare R2
 */
export const deleteFile = async (fileUrlOrKey) => {
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

/**
 * Download a file as a buffer from R2
 */
export const downloadFile = async (fileUrlOrKey) => {
  if (!s3Client || !bucketName) {
    console.log('[Storage Service] Local fallback for downloadFile:', fileUrlOrKey);
    // If it's a relative path starting with uploads, resolve it properly
    let resolvedPath = fileUrlOrKey;
    if (!path.isAbsolute(resolvedPath)) {
      if (resolvedPath.startsWith('uploads/') && fs.existsSync('/data')) {
        resolvedPath = path.join('/data', resolvedPath);
      } else {
        resolvedPath = path.resolve(resolvedPath);
      }
    }
    return fs.readFileSync(resolvedPath);
  }

  try {
    let fileKey = fileUrlOrKey;
    if (fileUrlOrKey.includes('r2.cloudflarestorage.com/')) {
      fileKey = fileUrlOrKey.split('r2.cloudflarestorage.com/')[1];
    } else if (customDomain && fileUrlOrKey.includes(customDomain)) {
      fileKey = fileUrlOrKey.split(customDomain)[1].replace(/^\//, '');
    }

    console.log(`[Storage Service] Downloading key: ${fileKey} from R2...`);

    const response = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    }));

    const streamToBuffer = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });

    return await streamToBuffer(response.Body);
  } catch (err) {
    console.error('[Storage Service] Download failed:', err.message);
    throw err;
  }
};

/**
 * Generate a signed URL for a file in R2
 */
export const getSignedUrl = async (fileUrlOrKey, expiresIn = 3600) => {
  if (!s3Client || !bucketName) {
    return fileUrlOrKey;
  }

  try {
    let fileKey = fileUrlOrKey;
    if (fileUrlOrKey.includes('r2.cloudflarestorage.com/')) {
      fileKey = fileUrlOrKey.split('r2.cloudflarestorage.com/')[1];
    } else if (customDomain && fileUrlOrKey.includes(customDomain)) {
      fileKey = fileUrlOrKey.split(customDomain)[1].replace(/^\//, '');
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    return await s3GetSignedUrl(s3Client, command, { expiresIn });
  } catch (err) {
    console.error('[Storage Service] GetSignedUrl failed:', err.message);
    return fileUrlOrKey;
  }
};
