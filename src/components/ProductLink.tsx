"use client";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  brand?: string | null;
  product?: string | null;
  ingredient?: string | null;
  amount?: number | null;
  unit?: string | null;
};

export default function ProductLink({ brand, product, ingredient, amount, unit }: Props) {
  const [href, setHref] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle"|"loading"|"done"|"fail">("idle");

  const qHuman = useMemo(() => {
    return [brand, product, ingredient, amount ? `${amount} ${unit ?? ""}`.trim() : null]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }, [brand, product, ingredient, amount, unit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      setHref(null);

      // Try progressively broader queries
      const attempts: Record<string,string>[] = [];
      attempts.push({ brand: brand ?? "", product: product ?? "", ingredient: ingredient ?? "", amount: String(amount ?? ""), unit: unit ?? "" });
      attempts.push({ brand: brand ?? "", product: product ?? "" });
      attempts.push({ brand: brand ?? "", ingredient: ingredient ?? "" });
      attempts.push({ brand: brand ?? "" });

      for (const params of attempts) {
        const qs = new URLSearchParams(params);
        // strip empties
        [...qs.keys()].forEach(k => { if (!qs.get(k)) qs.delete(k); });
        if ([...qs.keys()].length === 0) continue;

        try {
          const res = await fetch(`/api/link/resolve?${qs.toString()}`, { cache: "no-store" });
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            if (data?.url) {
              setHref(data.url);
              setStatus("done");
              return;
            }
          }
        } catch {}
      }
      if (!cancelled) setStatus("fail");
    })();
    return () => { cancelled = true; };
  }, [brand, product, ingredient, amount, unit]);

  if (status === "loading") {
    return <div className="muted" style={{fontSize:12, marginTop:6}}>Finding product page…</div>;
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{textDecoration:"none"}}>
        View product page
      </a>
    );
  }
  // Optional gentle fallback search if nothing resolved
  if (status === "fail" && qHuman) {
    const fallback = `https://duckduckgo.com/?q=${encodeURIComponent(qHuman)}`;
    return (
      <a href={fallback} target="_blank" rel="noopener noreferrer" className="btn" style={{textDecoration:"none"}}>
        Search the web
      </a>
    );
  }
  return null;
}
