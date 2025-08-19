"use client";

import React, { useEffect, useRef, useState } from "react";
import ResultCard from "@/components/ResultCard";
import ProfileBar from "@/components/ProfileBar";
import StackPanel from "@/components/StackPanel";
import HistoryPanel from "@/components/HistoryPanel";
import { useProfile } from "@/lib/profile";
import type { StackItem } from "@/types/suppscan";
import { useStack } from "@/lib/stack";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { dataUrlFromFile, useHistoryStore } from "@/lib/history";
import { detectBadgesFromText, scoreConfidence } from "@/lib/confidence";

type Props = { onReady?: (file: File, previewUrl: string) => void };

export default function ImageUpload({ onReady }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [explaining, setExplaining] = useState(false);

  const [serverResult, setServerResult] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);

  const [profile] = useProfile();
  const stack = useStack();
  const history = useHistoryStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const accept = "image/jpeg,image/png,image/webp";
  const maxBytes = 10 * 1024 * 1024;

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function selectFile(f: File) {
    setError(null); setServerResult(null); setExplanation(null);
    if (!f.type.startsWith("image/")) return setError("Please choose an image file.");
    if (!accept.split(",").includes(f.type)) return setError("Use JPG, PNG or WEBP.");
    if (f.size > maxBytes) return setError("Max file size is 10MB.");
    const url = URL.createObjectURL(f);
    setFile(f); setPreview(url); onReady?.(f, url);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) selectFile(f); }
  function onDrop(e: React.DragEvent<HTMLLabelElement>) { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) selectFile(f); }
  function onDragOver(e: React.DragEvent<HTMLLabelElement>) { e.preventDefault(); }

  function reset() {
    setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null);
    setError(null); setServerResult(null); setExplanation(null); setExplaining(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function tryDecodeBarcode(): Promise<string | null> {
    try {
      if (!imgRef.current) return null;
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageElement(imgRef.current);
      return result?.getText() || null;
    } catch { return null; }
  }

  async function upload() {
    if (!file) return setError("Choose an image first.");
    setError(null); setUploading(true); setServerResult(null); setExplanation(null);
    try {
      const fd = new FormData(); fd.append("image", file, file.name || "image.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || `Upload failed (${res.status})`);

      // dietary badges from OCR text (client-side)
      const badges = detectBadgesFromText(json?.ocr?.raw_text || "");
      json.extracted = json.extracted || {};
      json.extracted.badges = Array.from(new Set([...(json.extracted.badges||[]), ...badges]));

      // barcode detection
      const barcode = await tryDecodeBarcode();
      if (barcode) json.barcode = barcode;

      setServerResult(json);

      setExplaining(true);
      const payload: any = {
        brand: json.extracted?.brandGuess ?? null,
        product: json.extracted?.productGuess ?? null,
        npn: json.extracted?.npn ?? null,
        ingredients: json.extracted?.ingredients ?? [],
        locale: "CA",
        profile
      };
      const res2 = await fetch("/api/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json2 = await res2.json();
      if (!res2.ok || !json2.ok) throw new Error(json2?.error || `Explain failed (${res2.status})`);
      setExplanation(json2.explanation);

      // Save to history (img as dataURL)
      const imgDataUrl = await dataUrlFromFile(file);
      history.add({
        id: Math.random().toString(36).slice(2),
        when: Date.now(),
        brand: payload.brand,
        product: payload.product,
        barcode: barcode || null,
        imgDataUrl,
        ingredients: payload.ingredients,
        explanation: json2.explanation
      });
    } catch (err:any) {
      setError(err?.message || String(err));
    } finally {
      setUploading(false); setExplaining(false);
    }
  }

  function addToStack() {
    if (!serverResult?.extracted?.ingredients?.length) return;
    const item: StackItem = {
      id: Math.random().toString(36).slice(2),
      when: Date.now(),
      brand: serverResult?.extracted?.brandGuess ?? null,
      product: serverResult?.extracted?.productGuess ?? null,
      ingredients: serverResult.extracted.ingredients
    };
    stack.add(item);
  }

  const confidence = serverResult ? scoreConfidence({
    ocr: serverResult.ocr, extracted: serverResult.extracted,
    meta: serverResult.meta, barcode: serverResult.barcode || null
  }) : null;

  return (
    <div style={{maxWidth:780, margin:"0 auto"}}>
      <label htmlFor="file" className="drop" onDrop={onDrop} onDragOver={onDragOver}>
        <div>
          <strong>Drop an image</strong> or click to choose
          <div className="muted" style={{marginTop:6,fontSize:12}}>JPG / PNG / WEBP · Max 10MB</div>
        </div>
        <input ref={inputRef} id="file" type="file" accept={accept} onChange={onInputChange} style={{display:"none"}} />
      </label>

      {error && <p className="error">{error}</p>}

      {preview && (
        <div className="split" style={{marginTop:16}}>
          {/* Left: smaller image + actions */}
          <div className="left">
            <img ref={imgRef} src={preview} alt="Preview" className="preview-small" />
            <div className="row">
              <button className="btn btn-primary" onClick={upload} disabled={uploading}>
                {uploading ? "Analyzing…" : "Analyze"}
              </button>
              <button className="btn btn-ghost" onClick={reset} disabled={uploading || explaining}>
                New scan
              </button>
              {explanation && (
                <>
                  <button className="btn btn-ghost" onClick={addToStack}>Add to stack</button>
                  <a className="btn btn-ghost" href="/report">Open reports</a>
                </>
              )}
            </div>
            {file && (
              <div className="meta">
                {file.name} · {(file.size/1024/1024).toFixed(2)} MB · {file.type}
              </div>
            )}
          </div>

          {/* Right: profile + analysis + stack + history */}
          <div className="right">
            <ProfileBar />
            {explanation ? (
              <ResultCard
                explanation={explanation}
                extracted={serverResult?.extracted}
                barcode={serverResult?.barcode || null}
                confidence={confidence}
              />
            ) : (
              <div className="card" style={{minHeight:140, display:"grid", placeItems:"center", color:"var(--muted)"}}>
                {explaining ? "Generating summary…" : "Click Analyze to generate guidance."}
              </div>
            )}
            <StackPanel />
            <HistoryPanel />
          </div>
        </div>
      )}
    </div>
  );
}
