"use client";
import React from "react";
import PriceWidget from "@/components/PriceWidget";

/** Renders price-per-dose UI (uses existing PriceWidget) */
export default function LeftPricePanel() {
  return (
    <div style={{ marginTop: 12 }}>
      <PriceWidget />
    </div>
  );
}
