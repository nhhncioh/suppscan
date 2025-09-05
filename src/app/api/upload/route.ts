// src/app/api/upload/route.ts - COMPLETE FIXED FILE
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

    // Enhanced OCR with specific focus on ingredient sections
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { 
          role: "system", 
          content: "You are an expert OCR system for supplement labels. Extract ALL text accurately, paying special attention to ingredient lists, supplement facts panels, and complete ingredient sections including 'Other ingredients', 'Non-medicinal ingredients', and 'Inactive ingredients'." 
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                'Extract ALL text from this supplement label and return STRICT JSON: ' +
                '{ "raw_text": string, "lines": string[], "npn": string|null, "brand_guess": string|null, "product_guess": string|null }. ' +
                "If you see NPN or DIN-HM followed by 8 digits, set npn. " +
                "Lines should be organized top-to-bottom and preserve ingredient section headers. " +
                "CRITICAL: Include complete ingredient lists including both active and inactive ingredients. " +
                "Look for sections like 'Other ingredients:', 'Non-medicinal ingredients:', 'Inactive ingredients:' and include everything in those sections. " +
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

    console.log('=== UPLOAD ROUTE DEBUG ===');
    console.log('Raw OCR text length:', rawText.length);
    console.log('Number of lines:', lines.length);
    console.log('First 500 chars of OCR:', rawText.substring(0, 500));

    // Extract active ingredients using existing system (for supplement facts)
    const activeIngredients = extractIngredients(lines, ocr.brand_guess ?? null);
    console.log('Active ingredients found:', activeIngredients.map(i => i.name));
    
    // Detect badges and certifications
    const badges = detectBadges(lines);
    const trustedMarks = detectTrustedMarksFromText(rawText);
    const enhancedBadges = detectBadgesFromText(rawText);
    const allBadges = Array.from(new Set([...badges, ...enhancedBadges]));

    // FIXED: Run cleanliness analysis on RAW OCR TEXT, not just active ingredients
    // This will use the enhanced extraction to find ALL ingredients
    console.log('Running cleanliness analysis on raw OCR text...');
    const cleanlinessAnalysis = analyzeIngredientCleanliness(
      rawText,
      undefined  // Let the enhanced system extract ALL ingredients from OCR
    );

    console.log('Cleanliness analysis results:');
    console.log('- Ingredients found:', cleanlinessAnalysis.analysis.length);
    console.log('- Ingredient names:', cleanlinessAnalysis.analysis.map(a => a.name));
    console.log('- Overall score:', cleanlinessAnalysis.cleanlinessScore.overall);

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
        ingredients: activeIngredients, // Keep original for supplement facts
        badges: allBadges,
        marks: trustedMarks,
        // ENHANCED: Now includes ALL ingredients found by enhanced extraction
        cleanlinessScore: cleanlinessAnalysis.cleanlinessScore,
        ingredientAnalysis: cleanlinessAnalysis.analysis
      }
    };

    console.log('Sending response with', cleanlinessAnalysis.analysis.length, 'ingredients analyzed');

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