"use client";

import React, { useEffect, useRef, useState } from "react";
import ResultCard from "@/components/ResultCard";

type Props = { onReady?: (file: File, previewUrl: string) => void };

function toArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  if (typeof v === "object") return Object.values(v);
  return [v];
}

export default function ImageUpload({ onReady }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);
  const [explaining, setExplaining] = useState(false);
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
    const url = URL.createObjectURL(f); setFile(f); setPreview(url); onReady?.(f, url);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) selectFile(f); }
  function onDrop(e: React.DragEvent<HTMLLabelElement>) { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) selectFile(f); }
  function onDragOver(e: React.DragEvent<HTMLLabelElement>) { e.preventDefault(); }

  function reset() {
    setFile(null); if (preview) URL.revokeObjectURL(preview); setPreview(null);
    setError(null); setServerResult(null); setExplanation(null);
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
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setUploading(false); setExplaining(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <label onDrop={onDrop} onDragOver={onDragOver} htmlFor="file"
        style={{ display:"grid", placeItems:"center", padding:24, border:"2px dashed #555", borderRadius:16, cursor:"pointer", minHeight:180, textAlign:"center" }}>
        <div>
          <strong>Drop an image</strong> or click to choose
          <div style={{ opacity:0.7, marginTop:6, fontSize:12 }}>JPG / PNG / WEBP • Max 10MB</div>
        </div>
        <input ref={inputRef} id="file" type="file" accept={accept} onChange={onInputChange} style={{ display:"none" }} />
      </label>

      {error && <p style={{ color:"#ff6b6b", marginTop:12, fontSize:14 }}>{error}</p>}

      {preview && (
        <div style={{ marginTop: 16 }}>
          <img src={preview} alt="Preview" style={{ width:"100%", height:"auto", borderRadius:12, border:"1px solid #333" }} />
          <div style={{ display:"flex", gap:12, marginTop:12 }}>
            <button onClick={upload} disabled={uploading}
              style={{ padding:"10px 16px", borderRadius:10, border:"1px solid #333", background:uploading ? "#333" : "#111", color:"white", opacity:uploading ? 0.7 : 1 }}>
              {uploading ? "Uploading..." : "Continue"}
            </button>
            <button onClick={reset} disabled={uploading || explaining}
              style={{ padding:"10px 16px", borderRadius:10, border:"1px solid #333", background:"transparent", color:"white" }}>
              Clear
            </button>
          </div>

          {file && <div style={{ marginTop:8, opacity:0.8, fontSize:12 }}>
            {file.name} · {(file.size/1024/1024).toFixed(2)} MB · {file.type}
          </div>}

          {serverResult && (
            <>
              <div style={{ marginTop: 12, fontWeight: 600 }}>Server result</div>
              <pre style={{ marginTop:6, background:"#111", border:"1px solid #333", borderRadius:10, padding:12, whiteSpace:"pre-wrap", wordBreak:"break-word", fontSize:12, textAlign:"left" }}>
{JSON.stringify(serverResult, null, 2)}
              </pre>
            </>
          )}

          {explanation && <ResultCard explanation={explanation} extracted={serverResult?.extracted} />}

          {explaining && <div style={{ marginTop: 8, opacity: 0.8 }}>Analyzing…</div>}
        </div>
      )}
    </div>
  );
}
