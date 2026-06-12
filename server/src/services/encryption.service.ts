import { encryptMessage, decryptMessage, generateConversationKey } from "../utils/crypto.util";
import { redis } from "../DB/redis";

class EncryptionService {
  private getConversationKeyRedisKey(conversationId: string): string {
    return `e2e:key:${conversationId}`;
  }

  async getOrCreateConversationKey(conversationId: string): Promise<string> {
    const redisKey = this.getConversationKeyRedisKey(conversationId);
    const existing = await redis.get(redisKey);
    if (existing) return existing;

    const newKey = generateConversationKey();
    await redis.set(redisKey, newKey);
    return newKey;
  }

  async encryptForConversation(conversationId: string, text: string): Promise<string> {
    const key = await this.getOrCreateConversationKey(conversationId);
    return encryptMessage(text, key);
  }

  async decryptForConversation(conversationId: string, encryptedText: string): Promise<string> {
    const key = await this.getOrCreateConversationKey(conversationId);
    return decryptMessage(encryptedText, key);
  }

  async rotateConversationKey(conversationId: string): Promise<string> {
    const redisKey = this.getConversationKeyRedisKey(conversationId);
    const newKey = generateConversationKey();
    await redis.set(redisKey, newKey);
    return newKey;
  }
}

export const encryptionService = new EncryptionService();