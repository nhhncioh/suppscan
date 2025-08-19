export const runtime = "nodejs";

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function arrify<T=any>(v: any): T[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (typeof v === "object") return Object.values(v);
  return [v];
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ ok:false, error:"Missing OPENAI_API_KEY" }), {
        status: 500, headers: { "Content-Type":"application/json" }
      });
    }

    const body = await req.json();
    const { brand, product, npn, ingredients, locale = "CA" } = body || {};

    const system =
      "You are a careful, evidence-informed supplement explainer. " +
      "Return STRICT JSON only. Never provide medical advice. Be concise and specific.";

    const user =
`Using this scanned label info:
${JSON.stringify({ brand, product, npn, ingredients, locale })}
Return STRICT JSON with keys:
{
  "product_summary": {
    "brand": string|null,
    "product": string|null,
    "npn": string|null,
    "key_ingredients": [{"name": string, "amount": number|null, "unit": "mcg"|"mg"|"g"|"iu"|null}]
  },
  "overview": string,
  "uses": [{"claim": string, "evidence_level": "strong"|"mixed"|"limited"|"unknown"}],
  "typical_adult_dose": [{"ingredient": string, "range": string, "unit": string|null, "context": string|null}],
  "how_to_take": [{"ingredient": string, "timing": string|null, "with_food": "yes"|"no"|"either"|null, "notes": string|null}],
  "label_vs_guidelines": [{
    "ingredient": string,
    "label_amount": number|null,
    "label_unit": "mcg"|"mg"|"g"|"iu"|null,
    "rda_or_ai": string|null,               // e.g., "600–800 IU/day adults"
    "ul": {"value": number|null, "unit": "mcg"|"mg"|"g"|"iu"|null}|null,  // tolerable upper limit if known
    "category": "below_rda"|"within_range"|"above_ul"|"unknown",
    "explanation": string,                  // one-sentence rationale
    "readable": string                      // one line like: "1000 IU — within general recommended range — do not exceed 4000 IU/day"
  }],
  "take_if": [                              // bullet points, max 8 words each
    {"scenario": string, "rationale": string}
  ],
  "may_improve": [
    {"area": string, "evidence_level": "strong"|"mixed"|"limited"|"unknown", "typical_timeframe": string|null}
  ],
  "upper_limits_and_warnings": [{"note": string}],
  "interactions_and_contraindications": [{"item": string, "note": string}],
  "quality_considerations": [string],
  "references": [{"title": string, "url": string}],
  "disclaimer": string
}
Requirements:
- “take_if” items must be short (≤8 words), practical, and conservative (e.g., deficiency signs, limited sun exposure, clinician advice).
- For label_vs_guidelines.readable: include the label amount+unit, verdict phrase (“within general recommended range”, “below typical intake”, “above upper limit”), and a UL line like “do not exceed 4000 IU/day” when known.
- Base dose ranges/UL on reputable guidance (e.g., NIH ODS / Health Canada); if unknown, set fields to null and use "unknown".
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // Normalize & keep shape stable
    const explanation = {
      product_summary: raw.product_summary ?? {
        brand, product, npn,
        key_ingredients: (ingredients || []).map((i: any) => ({ name: i.name, amount: i.amount ?? null, unit: i.unit ?? null })),
      },
      overview: raw.overview ?? "",
      uses: arrify(raw.uses),
      typical_adult_dose: arrify(raw.typical_adult_dose),
      how_to_take: arrify(raw.how_to_take),
      label_vs_guidelines: arrify(raw.label_vs_guidelines).map((x: any) => {
        const amount = x?.label_amount != null ? String(x.label_amount) : "?";
        const unit = x?.label_unit ? String(x.label_unit).toUpperCase() : "";
        const verdict =
          x?.category === "within_range" ? "within general recommended range" :
          x?.category === "below_rda"    ? "below typical intake guidance" :
          x?.category === "above_ul"     ? "above the upper limit" :
                                           "guidance unknown";
        // Try to surface UL even if model didn't put in `readable`
        let ulStr = "";
        if (x?.ul?.value && x?.ul?.unit) ulStr = ` — do not exceed ${x.ul.value} ${String(x.ul.unit).toUpperCase()}/day`;
        else {
          const m = /\b(\d[\d,.]*)\s*(iu|mg|mcg|g)\b/i.exec(x?.explanation || "");
          if (m) ulStr = ` — do not exceed ${m[1]} ${m[2].toUpperCase()}/day`;
        }
        const readable = x?.readable || `${amount} ${unit} — ${verdict}${ulStr}`;
        return { ...x, readable };
      }),
      take_if: arrify(raw.take_if),
      may_improve: arrify(raw.may_improve),
      upper_limits_and_warnings: arrify(raw.upper_limits_and_warnings),
      interactions_and_contraindications: arrify(raw.interactions_and_contraindications),
      quality_considerations: arrify(raw.quality_considerations),
      references: arrify(raw.references),
      disclaimer: raw.disclaimer || "This information is for educational purposes only and is not a substitute for professional medical advice.",
    };

    return new Response(JSON.stringify({ ok: true, explanation }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error:String(err) }), {
      status: 500, headers: { "Content-Type":"application/json" }
    });
  }
}
