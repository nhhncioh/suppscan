// src/app/api/upload/route.ts - COMPLETE FILE
export const runtime = "nodejs";

import OpenAI from "openai";
import { extractIngredients } from "@/lib/ingredients";
import { analyzeIngredientCleanliness } from "@/lib/ingredientCleanliness";
import { detectBadgesFromText, detectTrustedMarksFromText } from "@/lib/confidence";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function detectBadges(lines: string[]) {
  const text = lines.join(" ").toLowerCase();
  const badges: string[] = [];
  if (/\busp\b|\busp\s*verified\b/.test(text)) badges.push("USP Verified");
  if (/\bnsf\b/.test(text)) badges.push("NSF");
  if (/certified\s*for\s*sport/i.test(text)) badges.push("NSF Certified for Sport");
  if (/third[-\s]*party\s*(tested|verified|certified)/i.test(text)) badges.push("3rd-party tested");
  if (/\bgmp\b|\bgood\s*manufacturing\s*practices?\b/i.test(text)) badges.push("GMP");
  if (/\bvegan\b/i.test(text)) badges.push("Vegan");
  if (/\bvegetarian\b/i.test(text)) badges.push("Vegetarian");
  if (/\bgluten[-\s]?free\b/i.test(text)) badges.push("Gluten-free");
  if (/\bnon[-\s]?gmo\b|\bgmo[-\s]?free\b/i.test(text)) badges.push("Non-GMO");
  if (/\borganic\b/i.test(text)) badges.push("Organic");
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

    // Enhanced OCR with better ingredient detection
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { 
          role: "system", 
          content: "You are a precise OCR extractor for supplement labels. Focus on extracting ingredient lists, supplement facts, and product information accurately." 
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                'Extract text and return STRICT JSON: ' +
                '{ "raw_text": string, "lines": string[], "npn": string|null, "brand_guess": string|null, "product_guess": string|null }. ' +
                "If you see NPN or DIN-HM followed by 8 digits, set npn. " +
                "Lines should be short and organized top-to-bottom. " +
                "Pay special attention to ingredient lists and supplement facts panels. " +
                "Return only valid JSON, no additional text.",
            },
            { type: "image_url", image_url: { url: dataUrl } } as any,
          ] as any,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let ocr: any = {};
    
    try { 
      ocr = JSON.parse(content); 
    } catch (parseError) { 
      console.error('OCR JSON parse error:', parseError);
      ocr = { raw_text: content, lines: [content] }; // Fallback
    }

    // Process OCR results
    const rawText = ocr.raw_text || "";
    const lines: string[] = Array.isArray(ocr.lines) 
      ? ocr.lines 
      : String(rawText).split(/\r?\n/).filter(line => line.trim().length > 0);

    // Extract ingredients using existing system
    const ingredients = extractIngredients(lines, ocr.brand_guess ?? null);
    
    // Detect badges and certifications using enhanced system
    const badges = detectBadges(lines);
    const trustedMarks = detectTrustedMarksFromText(rawText);
    
    // NEW: Analyze ingredient cleanliness
    const cleanlinessAnalysis = analyzeIngredientCleanliness(
      rawText, 
      ingredients.map(ing => ing.name)
    );

    // Enhanced badge detection using new system
    const enhancedBadges = detectBadgesFromText(rawText);
    const allBadges = Array.from(new Set([...badges, ...enhancedBadges]));

    // Prepare response data
    const responseData = {
      ok: true,
      meta: { 
        name: (file as any).name ?? "unknown", 
        type: file.type, 
        size: file.size,
        uploadedAt: new Date().toISOString()
      },
      ocr: { 
        raw_text: rawText, 
        lines: lines,
        confidence: lines.length > 5 ? "high" : lines.length > 2 ? "medium" : "low"
      },
      extracted: {
        npn: ocr.npn ?? null,
        brandGuess: ocr.brand_guess ?? null,
        productGuess: ocr.product_guess ?? null,
        ingredients,
        badges: allBadges,
        marks: trustedMarks,
        // NEW: Cleanliness analysis
        cleanlinessScore: cleanlinessAnalysis.cleanlinessScore,
        ingredientAnalysis: cleanlinessAnalysis.analysis
      }
    };

    return new Response(JSON.stringify(responseData), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
    
  } catch (err) {
    console.error('Upload API Error:', err);
    
    // Return detailed error for debugging
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      ok: false, 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500, 
      headers: { "Content-Type": "application/json" }
    });
  }
}