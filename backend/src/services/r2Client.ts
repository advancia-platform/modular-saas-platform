/**
 * Cloudflare R2 client using AWS S3 SDK (R2 is S3-compatible)
 * Per Advancia Pay: Use for file uploads, backups, document storage
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config";
import logger from "../logger";

// Validate R2 configuration
if (
  !config.r2.accountId ||
  !config.r2.accessKeyId ||
  !config.r2.secretAccessKey
) {
  logger.warn(
    "Cloudflare R2 credentials not configured - file uploads will be disabled",
  );
}

// Initialize R2 client (S3-compatible)
export const r2Client = new S3Client({
  region: config.r2.region,
  endpoint: config.r2.endpoint, // R2 endpoint
  credentials: {
    accessKeyId: config.r2.accessKeyId || "",
    secretAccessKey: config.r2.secretAccessKey || "",
  },
  // R2-specific configuration
  forcePathStyle: false, // R2 uses virtual-hosted-style addressing
});

/**
 * Check R2 bucket connectivity and access
 */
export async function checkR2Connection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    if (!config.r2.bucketName) {
      return { connected: false, error: "R2 bucket name not configured" };
    }

    // Test bucket access
    const command = new HeadBucketCommand({
      Bucket: config.r2.bucketName,
    });

    await r2Client.send(command);

    logger.info("✅ Cloudflare R2 connection successful", {
      bucket: config.r2.bucketName,
      endpoint: config.r2.endpoint,
    });

    return { connected: true };
  } catch (error: any) {
    logger.error("❌ Cloudflare R2 connection failed", {
      error: error.message,
      code: error.code,
      bucket: config.r2.bucketName,
    });

    return {
      connected: false,
      error: error.message || "Unknown R2 connection error",
    };
  }
}

/**
 * Upload file to R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | string,
  contentType?: string,
): Promise<{ url: string; key: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
      // Metadata per Advancia Pay: Add audit info
      Metadata: {
        uploadedAt: new Date().toISOString(),
        service: "advancia-pay",
      },
    });

    await r2Client.send(command);

    // Construct public URL
    const publicUrl = config.r2.publicUrl
      ? `${config.r2.publicUrl}/${key}`
      : `${config.r2.endpoint}/${config.r2.bucketName}/${key}`;

    logger.info("File uploaded to R2", { key, contentType });

    return { url: publicUrl, key };
  } catch (error: any) {
    logger.error("Failed to upload to R2", { key, error: error.message });
    throw new Error(`R2 upload failed: ${error.message}`);
  }
}

/**
 * Generate presigned URL for temporary file access
 */
export async function getR2PresignedUrl(
  key: string,
  expiresIn: number = 3600,
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });

    logger.debug("Generated R2 presigned URL", { key, expiresIn });

    return url;
  } catch (error: any) {
    logger.error("Failed to generate R2 presigned URL", {
      key,
      error: error.message,
    });
    throw new Error(`R2 presigned URL generation failed: ${error.message}`);
  }
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
    });

    await r2Client.send(command);

    logger.info("File deleted from R2", { key });
  } catch (error: any) {
    logger.error("Failed to delete from R2", { key, error: error.message });
    throw new Error(`R2 deletion failed: ${error.message}`);
  }
}
