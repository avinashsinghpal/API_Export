import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from ENCRYPTION_KEY or a fallback for dev
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "exportleads-default-dev-secret-32b-key!";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: iv:ciphertext:authTag in base64.
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${encrypted.toString("base64")}:${authTag.toString("base64")}`;
}

/**
 * Decrypts an AES-256-GCM string (iv:ciphertext:authTag in base64).
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) {
      // If unencrypted fallback
      return encryptedPayload;
    }

    const [ivB64, encryptedB64, authTagB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const encrypted = Buffer.from(encryptedB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}
