import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export const generateKeyPair = (): { publicKey: string; privateKey: string } => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
};

export const encryptMessage = (text: string, key: string): string => {
  const keyBuffer = Buffer.from(key, "hex").slice(0, KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv) as crypto.CipherGCM;

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
};

export const decryptMessage = (encryptedData: string, key: string): string => {
  const [ivHex, tagHex, encrypted] = encryptedData.split(":");
  const keyBuffer = Buffer.from(key, "hex").slice(0, KEY_LENGTH);
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export const generateConversationKey = (): string => {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
};

export const hashData = (data: string): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

export const generateOTP = (length: number = 6): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
};

export const generateSecureToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString("hex");
};