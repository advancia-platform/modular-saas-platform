/**
 * Cloudflare R2 Storage Service (S3-compatible)
 *
 * Provides minimal wrapper functions for uploading, retrieving, deleting,
 * and generating signed URLs for objects stored in an R2 bucket.
 *
 * Environment Variables required:
 *  - R2_ACCOUNT_ID
 *  - R2_ACCESS_KEY_ID
 *  - R2_SECRET_ACCESS_KEY
 *  - R2_BUCKET
 *  - (optional) R2_PUBLIC_BASE_URL for constructing public URLs
 */
import crypto from "crypto";

/**
 * Cloudflare R2 Storage Service (direct SigV4 implementation, no AWS SDK)
 * Uses S3-compatible API endpoints with manual AWS Signature Version 4 signing.
 *
 * Required env vars:
 *  - R2_ACCOUNT_ID
 *  - R2_ACCESS_KEY_ID
 *  - R2_SECRET_ACCESS_KEY
 *  - R2_BUCKET
 * Optional:
 *  - R2_PUBLIC_BASE_URL (for constructing public asset URLs)
 */

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

let cfg: R2Config | null = null;

export function initR2Client(): void {
  if (cfg) return;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "R2 not configured (missing one of R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET)",
    );
  }
  cfg = { accountId, accessKeyId, secretAccessKey, bucket };
}

function ensure() {
  if (!cfg)
    throw new Error(
      "R2 client not initialized. Call initR2Client() early in startup.",
    );
}

function isoDate(date = new Date()): string {
  return (
    date
      .toISOString()
      .replace(/[-:]|\..+/g, "")
      .slice(0, 15) + "Z"
  ); // YYYYMMDDTHHMMSSZ
}

function shortDate(date = new Date()): string {
  return date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
}

interface SignedRequest {
  url: string;
  headers: Record<string, string>;
}

function signRequest(
  method: string,
  key: string,
  options: {
    body?: Buffer | string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    expiresInSeconds?: number;
  } = {},
): SignedRequest {
  ensure();
  const { body, headers = {}, query = {}, expiresInSeconds } = options;
  const date = new Date();
  const amzDate = isoDate(date);
  const dateStamp = shortDate(date);
  const service = "s3";
  const region = "auto";
  const host = `${cfg!.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${cfg!.bucket}/${encodeURIComponent(key)}`;

  const signedHeadersList = ["host", "x-amz-date"];

  // Pre-signed URL query parameters if requested
  const queryParams: Record<string, string> = { ...query };
  if (expiresInSeconds) {
    queryParams["X-Amz-Algorithm"] = "AWS4-HMAC-SHA256";
    queryParams["X-Amz-Credential"] = `${
      cfg!.accessKeyId
    }/${dateStamp}/${region}/${service}/aws4_request`;
    queryParams["X-Amz-Date"] = amzDate;
    queryParams["X-Amz-Expires"] = String(expiresInSeconds);
    queryParams["X-Amz-SignedHeaders"] = signedHeadersList.join(";");
  }

  const sortedQueryKeys = Object.keys(queryParams).sort();
  const canonicalQueryString = sortedQueryKeys
    .map((k) => {
      const v = queryParams[k];
      if (v === undefined) return `${encodeURIComponent(k)}=`; // maintain key for signing determinism
      return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
    })
    .join("&");

  const allHeaders: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    ...headers,
  };

  const canonicalHeaders =
    signedHeadersList
      .map((h) => `${h}:${allHeaders[h]}`.toLowerCase())
      .join("\n") + "\n";
  const signedHeaders = signedHeadersList.join(";");
  const payloadHash = body
    ? crypto.createHash("sha256").update(body).digest("hex")
    : crypto.createHash("sha256").update("").digest("hex");
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const kDate = crypto
    .createHmac("sha256", "AWS4" + cfg!.secretAccessKey)
    .update(dateStamp)
    .digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
  const kService = crypto
    .createHmac("sha256", kRegion)
    .update(service)
    .digest();
  const kSigning = crypto
    .createHmac("sha256", kService)
    .update("aws4_request")
    .digest();
  const signature = crypto
    .createHmac("sha256", kSigning)
    .update(stringToSign)
    .digest("hex");

  if (expiresInSeconds) {
    queryParams["X-Amz-Signature"] = signature;
  } else {
    allHeaders["Authorization"] = `${algorithm} Credential=${
      cfg!.accessKeyId
    }/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  const finalQueryKeys = Object.keys(queryParams).sort();
  const finalQueryString = finalQueryKeys
    .map((k) => {
      const v = queryParams[k];
      if (v === undefined) return `${encodeURIComponent(k)}=`;
      return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
    })
    .join("&");
  const url = `https://${host}${canonicalUri}${
    finalQueryString ? `?${finalQueryString}` : ""
  }`;

  return { url, headers: allHeaders };
}

export interface UploadResult {
  key: string;
  publicUrl?: string;
}

export async function uploadObject(
  key: string,
  data: Buffer | string,
  contentType?: string,
): Promise<UploadResult> {
  const req = signRequest("PUT", key, {
    body: typeof data === "string" ? Buffer.from(data) : data,
    headers: contentType ? { "content-type": contentType } : {},
  });
  const res = await fetch(req.url, {
    method: "PUT",
    headers: req.headers,
    body: data,
  });
  if (!res.ok)
    throw new Error(`R2 upload failed ${res.status} ${await res.text()}`);
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  return {
    key,
    publicUrl: publicBase
      ? `${publicBase.replace(/\/$/, "")}/${encodeURIComponent(key)}`
      : undefined,
  };
}

export interface ObjectStreamResult {
  key: string;
  body: ReadableStream<Uint8Array>;
  contentType?: string;
}

export async function getObjectStream(
  key: string,
): Promise<ObjectStreamResult> {
  const req = signRequest("GET", key);
  const res = await fetch(req.url, { method: "GET", headers: req.headers });
  if (!res.ok) throw new Error(`R2 get failed ${res.status}`);
  return {
    key,
    body: res.body!,
    contentType: res.headers.get("content-type") || undefined,
  };
}

export async function deleteObject(
  key: string,
): Promise<{ key: string; deleted: boolean }> {
  const req = signRequest("DELETE", key);
  const res = await fetch(req.url, { method: "DELETE", headers: req.headers });
  if (!res.ok) throw new Error(`R2 delete failed ${res.status}`);
  return { key, deleted: true };
}

export async function signedUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const req = signRequest("GET", key, { expiresInSeconds });
  return req.url;
}

export function isInitialized(): boolean {
  return !!cfg;
}

try {
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  )
    initR2Client();
} catch (_) {}
