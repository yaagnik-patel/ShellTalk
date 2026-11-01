import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// WARNING: FALLBACK KEY FOR MVP ONLY. MUST BE REPLACED.
const fallbackKey = "0123456789abcdef0123456789abcdef";
const keyString = process.env.SHELLTALK_ENCRYPTION_KEY || fallbackKey;

// Ensure 32 byte key length for AES-256
if (keyString.length !== 32) {
  console.error(
    "CRITICAL: SHELLTALK_ENCRYPTION_KEY must be exactly 32 characters long.",
  );
  process.exit(1);
}

const key = Buffer.from(keyString, "utf8");

export function hashText(text) {
  if (!text) return null;
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function encryptText(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptText(encryptedText) {
  if (!encryptedText) return null;

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText; // Probably unencrypted legacy data

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Decryption failed:", error.message);
    }
    return "[Message Decryption Failed]";
  }
}
