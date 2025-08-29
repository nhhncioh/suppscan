
// src/components/EvidenceBadge.tsx
'use client';
import React from 'react';
import { EvidenceLevel, EvidenceCopy } from '../lib/evidence';

export default function EvidenceBadge({ level }: { level: EvidenceLevel | null }) {
  if (!level) return null;
  const copy = EvidenceCopy[level];
  const color =
    level === 'strong' ? 'bg-emerald-600' :
    level === 'moderate' ? 'bg-blue-600' :
    level === 'limited' ? 'bg-amber-600' : 'bg-stone-600';
  return (
    <span title={copy.tooltip} className={`text-xs ${color} text-white px-2 py-1 rounded`}>
      {copy.label}
    </span>
  );
}
