import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { resolveStoragePath } from '../utils/storagePath.js';

let s3Client = null;

const bucketName = process.env.STORAGE_BUCKET || process.env.R2_BUCKET_NAME;
const endpoint = process.env.STORAGE_ENDPOINT;
const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
const region = process.env.STORAGE_REGION || 'auto';
const customDomain = process.env.R2_PUBLIC_CUSTOM_DOMAIN; // e.g. https://pub-xxx.r2.dev

const isConfigured = bucketName && accessKeyId && secretAccessKey;

if (isConfigured) {
  try {
    const s3Config = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Highly recommended for generic S3/Railway Buckets
    };

    if (endpoint) {
      s3Config.endpoint = endpoint;
    } else if (process.env.R2_ACCOUNT_ID) {
      s3Config.endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    }

    s3Client = new S3Client(s3Config);
    console.log('[Storage Service] S3-compatible storage client initialized successfully.');
  } catch (err) {
    console.error('[Storage Service] Failed to initialize S3Client:', err.message);
  }
} else {
  console.warn('[Storage Service] Storage credentials not fully set — falling back to local storage.');
}

export const isR2Active = () => !!s3Client;

/**
 * Upload a local file (or file object) to the storage bucket
 */
export const uploadFile = async (fileOrPath, originalName, mimeType = 'application/pdf') => {
  if (!s3Client || !bucketName) {
    console.log('[Storage Service] Storage client not active — using local file path fallback.');
    const pathStr = typeof fileOrPath === 'object' && fileOrPath !== null ? fileOrPath.path : fileOrPath;
    return pathStr.replace(/\\/g, '/');
  }

  let fileKey = '';
  try {
    let localFilePath;
    let name;
    let type;

    if (typeof fileOrPath === 'object' && fileOrPath !== null) {
      localFilePath = fileOrPath.path || fileOrPath.tempFilePath;
      name = fileOrPath.originalname || fileOrPath.name;
      type = fileOrPath.mimetype || fileOrPath.type || 'application/pdf';
    } else {
      localFilePath = fileOrPath;
      name = originalName || path.basename(fileOrPath);
      type = mimeType || 'application/pdf';
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    fileKey = `uploads/${Date.now()}-${path.basename(name)}`;
    
    console.log(`STORAGE_UPLOAD_START: Key: ${fileKey}`);
    console.log(`[Storage Service] Uploading ${name} to S3 bucket ${bucketName}...`);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: type,
    }));
    
    console.log(`STORAGE_UPLOAD_SUCCESS: Key: ${fileKey}`);
    console.log(`[Storage Service] Upload successful. Key: ${fileKey}`);

    if (endpoint) {
      const cleanEndpoint = endpoint.replace(/\/$/, '');
      return `${cleanEndpoint}/${bucketName}/${fileKey}`;
    }
    if (customDomain) {
      return `${customDomain.replace(/\/$/, '')}/${fileKey}`;
    }
    if (process.env.R2_ACCOUNT_ID) {
      return `https://${bucketName}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileKey}`;
    }
    return `${fileKey}`;
  } catch (err) {
    console.error(`STORAGE_UPLOAD_FAILED: Key: ${fileKey || 'unknown'}, Error: ${err.message}`);
    console.error('[Storage Service] S3 upload failed:', err.message);
    const pathStr = typeof fileOrPath === 'object' && fileOrPath !== null ? fileOrPath.path : fileOrPath;
    return pathStr.replace(/\\/g, '/');
  }
};

/**
 * Delete a file from the storage bucket
 */
export const deleteFile = async (fileUrlOrKey) => {
  if (!s3Client || !bucketName) return;

  try {
    let fileKey = fileUrlOrKey;
    if (fileUrlOrKey.includes('uploads/')) {
      fileKey = fileUrlOrKey.substring(fileUrlOrKey.indexOf('uploads/'));
    } else if (fileUrlOrKey.includes(`${bucketName}/`)) {
      fileKey = fileUrlOrKey.split(`${bucketName}/`)[1];
    } else if (fileUrlOrKey.includes('r2.cloudflarestorage.com/')) {
      fileKey = fileUrlOrKey.split('r2.cloudflarestorage.com/')[1];
    } else if (customDomain && fileUrlOrKey.includes(customDomain)) {
      fileKey = fileUrlOrKey.split(customDomain)[1].replace(/^\//, '');
    }

    console.log(`[Storage Service] Deleting key: ${fileKey} from bucket ${bucketName}...`);

    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    }));
    
    console.log('[Storage Service] Deletion successful.');
  } catch (err) {
    console.error('[Storage Service] S3 deletion failed:', err.message);
  }
};

/**
 * Download a file as a buffer from S3/R2
 */
export const downloadFile = async (fileUrlOrKey) => {
  if (!s3Client || !bucketName) {
    console.log('[Storage Service] Local fallback for downloadFile:', fileUrlOrKey);
    const resolvedPath = resolveStoragePath(fileUrlOrKey);
    return fs.readFileSync(resolvedPath);
  }

  let fileKey = fileUrlOrKey;
  try {
    if (fileUrlOrKey.includes('uploads/')) {
      fileKey = fileUrlOrKey.substring(fileUrlOrKey.indexOf('uploads/'));
    } else if (fileUrlOrKey.includes(`${bucketName}/`)) {
      fileKey = fileUrlOrKey.split(`${bucketName}/`)[1];
    } else if (fileUrlOrKey.includes('r2.cloudflarestorage.com/')) {
      fileKey = fileUrlOrKey.split('r2.cloudflarestorage.com/')[1];
    } else if (customDomain && fileUrlOrKey.includes(customDomain)) {
      fileKey = fileUrlOrKey.split(customDomain)[1].replace(/^\//, '');
    }

    console.log(`STORAGE_DOWNLOAD_START: Key: ${fileKey}`);
    console.log(`[Storage Service] Downloading key: ${fileKey} from bucket ${bucketName}...`);

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

    const buffer = await streamToBuffer(response.Body);
    console.log(`STORAGE_DOWNLOAD_SUCCESS: Key: ${fileKey}`);
    return buffer;
  } catch (err) {
    console.error(`STORAGE_DOWNLOAD_FAILED: Key: ${fileKey}, Error: ${err.message}`);
    console.error('[Storage Service] Download failed:', err.message);
    throw err;
  }
};

/**
 * Generate a signed URL for a file in S3/R2
 */
export const getSignedUrl = async (fileUrlOrKey, expiresIn = 3600) => {
  if (!s3Client || !bucketName) {
    return fileUrlOrKey;
  }

  try {
    let fileKey = fileUrlOrKey;
    if (fileUrlOrKey.includes('uploads/')) {
      fileKey = fileUrlOrKey.substring(fileUrlOrKey.indexOf('uploads/'));
    } else if (fileUrlOrKey.includes(`${bucketName}/`)) {
      fileKey = fileUrlOrKey.split(`${bucketName}/`)[1];
    } else if (fileUrlOrKey.includes('r2.cloudflarestorage.com/')) {
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
