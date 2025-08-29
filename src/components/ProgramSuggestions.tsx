
// src/components/ProgramSuggestions.tsx
'use client';
import React from 'react';
import EvidenceBadge from './EvidenceBadge';
import { getEvidenceLevel } from '../lib/evidence';
import { getProgramsForSelection } from '../lib/programs';


interface Props { selected: string[]; recs: { name: string }[]; }

export default function ProgramSuggestions({ selected, recs }: Props) {
  const programs = getProgramsForSelection(selected);
  if (!programs.length) return null;
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-2">
        <span>🧭</span>
        <h3 className="font-semibold">Guided Programs (2 weeks)</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {programs.map(p => (
          <div key={p.id} className="rounded border border-white/10 bg-white/5 p-3">
            <div className="font-medium mb-1">{p.title}</div>
            <div className="text-sm opacity-80 mb-2">{p.summary}</div>
            <div className="text-xs uppercase opacity-70 mb-1">Core stack</div>
            <ul className="mb-2 space-y-1 text-sm">
              {p.stack.map((s, i) => (
                <li key={i} className="flex items-center gap-2 justify-between">
                  <span>{s.name} • <span className="opacity-70">{s.timing}</span></span>
                  <EvidenceBadge level={s.evidence ?? getEvidenceLevel(s.name, p.id)} />
                </li>
              ))}
            </ul>
            <details className="text-sm">
              <summary className="cursor-pointer opacity-80">View steps</summary>
              <div className="mt-2">
                <div className="text-xs uppercase opacity-60">Week 1</div>
                <ul className="list-disc ml-5 mb-2">
                  {p.stepsWeek1.map((st, i) => <li key={i}><strong>{st.title}:</strong> {st.details}</li>)}
                </ul>
                <div className="text-xs uppercase opacity-60">Week 2</div>
                <ul className="list-disc ml-5">
                  {p.stepsWeek2.map((st, i) => <li key={i}><strong>{st.title}:</strong> {st.details}</li>)}
                </ul>
              </div>
            </details>
            {p.disclaimer && <div className="text-[11px] opacity-60 mt-2">{p.disclaimer}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
