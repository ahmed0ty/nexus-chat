import Redis from "ioredis";
import { config } from "../config";

class RedisClient {
  private client: Redis;
  private static instance: RedisClient;

  private constructor() {
    const isSecure = config.redis.url.startsWith("rediss://");

    this.client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      lazyConnect: false,
      tls: isSecure ? { rejectUnauthorized: false } : undefined,
    });

    this.client.on("connect", () => console.log("✅ Redis connected"));
    this.client.on("ready", () => console.log("✅ Redis ready"));
    this.client.on("error", (err) => console.error("❌ Redis error:", err));
  }

  static getInstance(): RedisClient {
    if (!RedisClient.instance) RedisClient.instance = new RedisClient();
    return RedisClient.instance;
  }

  getClient(): Redis { return this.client; }

  async setOnlineStatus(userId: string, socketId: string): Promise<void> {
    const key = `user:${userId}`;
    await this.client.hmset(key, {
      socketId,
      isOnline: "true",
      lastSeen: Date.now().toString(),
    });
    await this.client.expire(key, 86400);
  }

  async setOfflineStatus(userId: string): Promise<void> {
    const key = `user:${userId}`;
    await this.client.hmset(key, {
      isOnline: "false",
      lastSeen: Date.now().toString(),
    });
    await this.client.hdel(key, "socketId");
  }

  async getUserStatus(userId: string): Promise<{ isOnline: boolean; lastSeen: Date; socketId?: string }> {
    const data = await this.client.hgetall(`user:${userId}`);
    return {
      isOnline: data.isOnline === "true",
      lastSeen: new Date(Number(data.lastSeen) || Date.now()),
      socketId: data.socketId,
    };
  }

  async cacheTranslation(key: string, translation: string): Promise<void> {
    await this.client.setex(`translation:${key}`, 86400 * 7, translation);
  }

  async getTranslation(key: string): Promise<string | null> {
    return this.client.get(`translation:${key}`);
  }

  async setSession(userId: string, token: string, ttl: number): Promise<void> {
    await this.client.setex(`session:${userId}:${token}`, ttl, "valid");
  }

  async deleteSession(userId: string, token: string): Promise<void> {
    await this.client.del(`session:${userId}:${token}`);
  }

  async isSessionValid(userId: string, token: string): Promise<boolean> {
    const result = await this.client.get(`session:${userId}:${token}`);
    return result === "valid";
  }

  async setTyping(conversationId: string, userId: string): Promise<void> {
    await this.client.setex(`typing:${conversationId}:${userId}`, 5, "1");
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    const keys = await this.client.keys(`typing:${conversationId}:*`);
    return keys.map((k) => k.split(":")[2]);
  }

  async removeTyping(conversationId: string, userId: string): Promise<void> {
    await this.client.del(`typing:${conversationId}:${userId}`);
  }
}

export const redisClient = RedisClient.getInstance();
export const redis = redisClient.getClient();