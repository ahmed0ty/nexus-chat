import axios from "axios";
import * as cheerio from "cheerio";
import { ILinkPreview } from "../types";
import { redis } from "../DB/redis";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const extractUrls = (text: string): string[] => {
  return text.match(URL_REGEX) ?? [];
};

export const fetchLinkPreview = async (url: string): Promise<ILinkPreview | null> => {
  const cacheKey = `preview:${Buffer.from(url).toString("base64").substring(0, 80)}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as ILinkPreview;

    const { data } = await axios.get<string>(url, {
      timeout: 5000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NexusBot/1.0)",
      },
      maxContentLength: 500000,
    });

    const $ = cheerio.load(data);

    const preview: ILinkPreview = {
      url,
      title:
        $('meta[property="og:title"]').attr("content") ||
        $("title").text() ||
        url,
      description:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        undefined,
      image:
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        undefined,
      siteName:
        $('meta[property="og:site_name"]').attr("content") ||
        new URL(url).hostname ||
        undefined,
    };

    await redis.setex(cacheKey, 86400, JSON.stringify(preview));
    return preview;
  } catch {
    return null;
  }
};