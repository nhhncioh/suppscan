export const runtime = "nodejs";

import OpenAI from "openai";
import type { Profile, IngredientAmount, GuidelineVerdict } from "@/types/suppscan";
import { compareToGuidelines } from "@/lib/guidelines";
import { getEvidence } from "@/data/evidence";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function arrify<T=any>(v: any): T[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (typeof v === "object") return Object.values(v);
  return [v];
}
function toVerdicts(ings: IngredientAmount[], profile: Profile): GuidelineVerdict[] {
  return ings.map(i => compareToGuidelines(i.name, i.amount, (i.unit as any) ?? null, profile));
}
function dedupeBy<T extends Record<string, any>>(list: T[], key: keyof T) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of list) {
    const k = String(item?.[key] ?? "").toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand, product, npn, ingredients = [], locale = "CA", profile } = body || {};
    const prof: Profile = profile ?? { ageBand:"19-70", sex:"unspecified", pregnant:false };

    // Deterministic numeric guidance
    const localVerdicts = toVerdicts(ingredients, prof);

    // Pull any local evidence packs (for any ingredient we support)
    const localHow = [];
    const localUses = [];
    const localTakeIf = [];
    const localMayImprove = [];
    for (const ing of ingredients as IngredientAmount[]) {
      const pack = getEvidence(ing?.name);
      if (!pack) continue;
      if (pack.how_to_take) localHow.push(...pack.how_to_take.map(h => ({ ingredient: ing.name, timing: h.timing, with_food: "either", notes: h.notes ?? null })));
      if (pack.uses)       localUses.push(...pack.uses.map(u => ({ claim: u.claim, evidence_level: u.evidence as any })));
      if (pack.take_if)    localTakeIf.push(...pack.take_if);
      if (pack.may_improve)localMayImprove.push(...pack.may_improve);
    }

    // Ask model for general-purpose bullets for ANY label
    let model: any = {};
    if (process.env.OPENAI_API_KEY) {
      const system = "You are an evidence-informed supplement explainer. Be concise, conservative, and return STRICT JSON only.";
      const user = `Given this scanned label and user profile:
${JSON.stringify({ brand, product, npn, locale, profile: prof, ingredients }, null, 2)}
Return STRICT JSON with keys: {
  "overview": string,
  "uses": [{"claim": string, "evidence_level": "strong"|"mixed"|"limited"|"unknown"}],
  "typical_adult_dose": [{"ingredient": string, "range": string, "unit": string|null, "context": string|null}],
  "how_to_take": [{"ingredient": string, "timing": string|null, "with_food": "yes"|"no"|"either"|null, "notes": string|null}],
  "take_if": [{"scenario": string, "rationale": string}],
  "may_improve": [{"area": string, "evidence_level": "strong"|"mixed"|"limited"|"unknown", "typical_timeframe": string|null}],
  "upper_limits_and_warnings": [{"note": string}],
  "interactions_and_contraindications": [{"item": string, "note": string}],
  "quality_considerations": [string],
  "references": [{"title": string, "url": string}],
  "disclaimer": string
}
Rules: Base content on mainstream sources (NIH ODS style). Be conservative. Do NOT invent numeric RDA/UL.`;
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }]
      });
      try { model = JSON.parse(completion.choices[0]?.message?.content || "{}"); } catch { model = {}; }
    }

    const mergedHow = dedupeBy([...arrify(model.how_to_take), ...localHow], "ingredient");
    const mergedUses = dedupeBy([...arrify(model.uses), ...localUses], "claim");
    const mergedTakeIf = arrify(model.take_if).length ? arrify(model.take_if) : (localTakeIf.length ? localTakeIf : [
      { scenario: "Clinician recommended", rationale: "Personalized assessment." },
      { scenario: "Diet lacks this nutrient", rationale: "Intake may be low." },
      { scenario: "Confirmed deficiency", rationale: "Use under clinician guidance." }
    ]);
    const mergedMayImprove = arrify(model.may_improve).length ? arrify(model.may_improve) : (localMayImprove.length ? localMayImprove : [
      { area: "Deficiency-related symptoms", evidence_level: "strong", typical_timeframe: "varies by nutrient" }
    ]);

    const explanation = {
      product_summary: { brand, product, npn, key_ingredients: ingredients },
      overview: model.overview ?? "",
      uses: mergedUses,
      typical_adult_dose: arrify(model.typical_adult_dose),
      how_to_take: mergedHow,
      label_vs_guidelines: localVerdicts,
      take_if: mergedTakeIf,
      may_improve: mergedMayImprove,
      upper_limits_and_warnings: arrify(model.upper_limits_and_warnings),
      interactions_and_contraindications: arrify(model.interactions_and_contraindications),
      quality_considerations: arrify(model.quality_considerations),
      references: arrify(model.references),
      disclaimer: model.disclaimer || "This information is for educational purposes only and is not a substitute for professional medical advice."
    };

    return new Response(JSON.stringify({ ok: true, explanation }), { status: 200, headers: { "Content-Type": "application/json" }});
  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error:String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}
