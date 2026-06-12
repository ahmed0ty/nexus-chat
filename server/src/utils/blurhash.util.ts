import sharp from "sharp";
import { encode } from "blurhash";

export const generateBlurhash = async (imageBuffer: Buffer): Promise<string> => {
  try {
    const { data, info } = await sharp(imageBuffer)
      .resize(32, 32, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const hash = encode(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      4,
      4
    );

    return hash;
  } catch {
    return "LEHV6nWB2yk8pyo0adR*.7kCMdnj";
  }
};

export const generateBlurhashFromBase64 = async (base64: string): Promise<string> => {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  return generateBlurhash(buffer);
};