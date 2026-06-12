import axios from "axios";
import { redisClient } from "../DB/redis";

interface TranslateOptions {
  text: string;
  targetLang: string;
  sourceLang?: string;
}

interface TranslateResult {
  translatedText: string;
  detectedLanguage?: string;
}

class TranslationService {
  private generateCacheKey(text: string, targetLang: string, sourceLang: string): string {
    const hash = Buffer.from(`${text}:${sourceLang}:${targetLang}`).toString("base64");
    return hash.substring(0, 100);
  }

  async translate({ text, targetLang, sourceLang = "auto" }: TranslateOptions): Promise<TranslateResult> {
    const cacheKey = this.generateCacheKey(text, targetLang, sourceLang);
    const cached = await redisClient.getTranslation(cacheKey);
    if (cached) return JSON.parse(cached) as TranslateResult;

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await axios.get<any>(url, { timeout: 10000 });
      
      const translated = response.data[0]
        .map((item: any) => item[0])
        .filter(Boolean)
        .join("");

      const detectedLang = response.data[2] ?? undefined;

      const result: TranslateResult = {
        translatedText: translated,
        detectedLanguage: detectedLang,
      };

      await redisClient.cacheTranslation(cacheKey, JSON.stringify(result));
      return result;
    } catch (error) {
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      const response = await axios.get<any>(url, { timeout: 5000 });
      return response.data[2] ?? "en";
    } catch {
      return "en";
    }
  }
}

export const translationService = new TranslationService();