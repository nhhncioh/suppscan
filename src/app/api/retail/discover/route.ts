import { NextRequest, NextResponse } from "next/server";
import { discoverProductUrl } from "@/lib/discoverProduct";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const out = await discoverProductUrl({
      brand: body?.brand ?? null,
      product: body?.product ?? null,
      ingredient: body?.ingredient ?? null,
      amount: body?.amount ?? null,
      unit: body?.unit ?? null,
      locale: body?.locale ?? null,
    });
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
