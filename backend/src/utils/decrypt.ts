import crypto from "crypto";

export function decryptSecret(
  encrypted: string,
  keyHex: string,
  ivHex: string
): string {
  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encrypted, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

export function decodeBase64Secret(base64Secret: string): string {
  return Buffer.from(base64Secret, "base64").toString("ascii");
}
