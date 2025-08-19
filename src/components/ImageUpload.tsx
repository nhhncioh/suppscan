"use client";

import React, { useEffect, useRef, useState } from "react";
import ResultCard from "@/components/ResultCard";

type Props = { onReady?: (file: File, previewUrl: string) => void };

export default function ImageUpload({ onReady }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [explaining, setExplaining] = useState(false);

  const [serverResult, setServerResult] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);
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

  async function upload() {
    if (!file) return setError("Choose an image first.");
    setError(null); setUploading(true); setServerResult(null); setExplanation(null);
    try {
      const fd = new FormData(); fd.append("image", file, file.name || "image.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || `Upload failed (${res.status})`);
      setServerResult(json);

      setExplaining(true);
      const payload = {
        brand: json.extracted?.brandGuess ?? null,
        product: json.extracted?.productGuess ?? null,
        npn: json.extracted?.npn ?? null,
        ingredients: json.extracted?.ingredients ?? [],
        locale: "CA",
      };
      const res2 = await fetch("/api/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json2 = await res2.json();
      if (!res2.ok || !json2.ok) throw new Error(json2?.error || `Explain failed (${res2.status})`);
      setExplanation(json2.explanation);
    } catch (err:any) {
      setError(err?.message || String(err));
    } finally {
      setUploading(false); setExplaining(false);
    }
  }

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
            <img src={preview} alt="Preview" className="preview-small" />
            <div className="row">
              <button className="btn btn-primary" onClick={upload} disabled={uploading}>
                {uploading ? "Analyzing…" : "Analyze"}
              </button>
              <button className="btn btn-ghost" onClick={reset} disabled={uploading || explaining}>
                New scan
              </button>
            </div>
            {file && (
              <div className="meta">
                {file.name} · {(file.size/1024/1024).toFixed(2)} MB · {file.type}
              </div>
            )}
          </div>

          {/* Right: analysis panel */}
          <div className="right">
            {explanation ? (
              <ResultCard explanation={explanation} extracted={serverResult?.extracted} />
            ) : (
              <div className="card" style={{minHeight:140, display:"grid", placeItems:"center", color:"var(--muted)"}}>
                {explaining ? "Generating summary…" : "Click Analyze to generate guidance."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
