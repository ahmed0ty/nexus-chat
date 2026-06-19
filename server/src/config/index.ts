import dotenv from "dotenv";
dotenv.config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
};

export const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: requireEnv("MONGODB_URI"),
  jwt: {
    secret: requireEnv("JWT_SECRET"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  redis: {
    url: requireEnv("REDIS_URL"),
  },
  cloudinary: {
    cloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requireEnv("CLOUDINARY_API_KEY"),
    apiSecret: requireEnv("CLOUDINARY_API_SECRET"),
  },
  oauth: {
    google: {
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    },
    github: {
      clientId: requireEnv("GITHUB_CLIENT_ID"),
      clientSecret: requireEnv("GITHUB_CLIENT_SECRET"),
    },
  },
  translate: {
    url: process.env.LIBRE_TRANSLATE_URL || "https://libretranslate.com",
    key: process.env.LIBRE_TRANSLATE_KEY || "",
  },
  vapid: {
    publicKey: requireEnv("VAPID_PUBLIC_KEY"),
    privateKey: requireEnv("VAPID_PRIVATE_KEY"),
    subject: process.env.VAPID_SUBJECT || "mailto:admin@nexuschat.com",
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
} as const;