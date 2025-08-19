export const runtime = "nodejs";

import OpenAI from "openai";
import { extractIngredients } from "@/lib/ingredients";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function detectBadges(lines: string[]) {
  const text = lines.join(" ").toLowerCase();
  const badges: string[] = [];
  if (/\busp\b|\busp\s*verified\b/.test(text)) badges.push("USP Verified");
  if (/\bnsf\b/.test(text)) badges.push("NSF");
  if (/certified\s*for\s*sport/i.test(text)) badges.push("NSF Certified for Sport");
  if (/third[-\s]*party\s*(tested|verified|certified)/i.test(text)) badges.push("3rd-party tested");
  return Array.from(new Set(badges));
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ ok: false, error: "Missing field: image" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "Missing OPENAI_API_KEY" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buf.toString("base64")}`;

    // OCR
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a precise OCR extractor for supplement labels." },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                'Extract text and return STRICT JSON: ' +
                '{ "raw_text": string, "lines": string[], "npn": string|null, "brand_guess": string|null, "product_guess": string|null }. ' +
                "If you see NPN or DIN-HM followed by 8 digits, set npn. Lines short, top-to-bottom. JSON only.",
            },
            { type: "image_url", image_url: { url: dataUrl } } as any,
          ] as any,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let ocr: any = {};
    try { ocr = JSON.parse(content); } catch { ocr = {}; }

    const lines: string[] = Array.isArray(ocr.lines) ? ocr.lines : String(ocr.raw_text || "").split(/\r?\n/);
    const ingredients = extractIngredients(lines, ocr.brand_guess ?? null);
    const badges = detectBadges(lines);

    return new Response(JSON.stringify({
      ok: true,
      meta: { name: (file as any).name ?? "unknown", type: file.type, size: file.size },
      ocr: { raw_text: ocr.raw_text ?? "", lines },
      extracted: {
        npn: ocr.npn ?? null,
        brandGuess: ocr.brand_guess ?? null,
        productGuess: ocr.product_guess ?? null,
        ingredients,
        badges
      }
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error:String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
