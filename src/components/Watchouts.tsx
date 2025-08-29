
// src/components/Watchouts.tsx
'use client';
import React from 'react';
import { sideEffectWatch } from '../lib/sideEffects';

interface Props { selected: string[]; recs: { name: string }[]; }

export default function Watchouts({ selected, recs }: Props) {
  const names = recs.map(r => r.name);
  const watch = sideEffectWatch(selected, names);
  if (!watch.length) return null;
  return (
    <div className="mt-4 border border-white/10 rounded p-3 bg-white/5">
      <div className="text-sm mb-2 opacity-80">Side-effect watch</div>
      <ul className="space-y-1 text-sm">
        {watch.map((w, i) => (
          <li key={i} className={w.severity === 'warn' ? 'text-amber-300' : 'text-zinc-300'}>
            <strong>{w.supplement}:</strong> {w.message}
          </li>
        ))}
      </ul>
      <div className="text-[11px] opacity-60 mt-2">Informational only. Not medical advice.</div>
    </div>
  );
}
