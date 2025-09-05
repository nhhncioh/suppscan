// src/components/ImageUpload.tsx - COMPLETE FILE - Replace your existing one
"use client";

import React, { useEffect, useRef, useState } from "react";
import ResultCard from "@/components/ResultCard";
import { useProfile } from "@/lib/profile";
import type { StackItem } from "@/types/suppscan";
import { useStack } from "@/lib/stack";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { detectBadgesFromText, detectTrustedMarksFromText, scoreConfidence } from "@/lib/confidence";
import type { Confidence } from "@/lib/confidence";
import { Camera, Upload, RotateCcw, X, Zap, CheckCircle } from 'lucide-react';

type Props = { 
  onReady?: (file: File, previewUrl: string) => void;
  useMobileInterface?: boolean;
};

export default function ImageUpload({ onReady, useMobileInterface = false }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [serverResult, setServerResult] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);

  const [profile] = useProfile();
  const stack = useStack();

  // Detect if user is on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const accept = "image/jpeg,image/png,image/webp";
  const maxBytes = 10 * 1024 * 1024;

  // Determine which interface to show
  const shouldUseMobileInterface = useMobileInterface || isMobile;

  useEffect(() => {
    return () => { 
      if (preview) URL.revokeObjectURL(preview);
      stopCamera();
    };
  }, [preview]);

  // Camera functions
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setError('Camera access denied. Please use file upload instead.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const file = new File([blob], `supplement-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const url = URL.createObjectURL(file);
      
      handleFileCapture(file, url);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  // File handling
  const handleFileCapture = (capturedFile: File, previewUrl: string) => {
    setFile(capturedFile);
    setPreview(previewUrl);
    setError(null);
    setServerResult(null);
    setExplanation(null);
    setConfidence(null);
    onReady?.(capturedFile, previewUrl);
  };

  const selectFile = (f: File) => {
    setError(null);
    if (!f.type.startsWith("image/")) { 
      setError("Please choose an image file."); 
      return; 
    }
    if (!accept.split(",").includes(f.type)) { 
      setError("Use JPG, PNG or WEBP."); 
      return; 
    }
    if (f.size > maxBytes) { 
      setError("Max file size is 10MB."); 
      return; 
    }
    const url = URL.createObjectURL(f);
    handleFileCapture(f, url);
  };

  // Event handlers
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  function reset() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    setServerResult(null);
    setExplanation(null);
    setConfidence(null);
    setExplaining(false);
    setUploading(false);
    stopCamera();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function tryDecodeBarcode(): Promise<string | null> {
    try {
      if (!imgRef.current) return null;
      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromImageElement(imgRef.current);
      return result?.getText() || null;
    } catch {
      return null;
    }
  }

  async function upload() {
    if (!file) { 
      setError("Choose an image first."); 
      return; 
    }
    setError(null);
    setUploading(true);
    setServerResult(null);
    setExplanation(null);
    setConfidence(null);
    
    try {
      const fd = new FormData();
      fd.append("image", file, file.name || "image.jpg");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error || `Upload failed (${res.status})`);

      const rawText = json?.ocr?.raw_text || "";
      const badges = detectBadgesFromText(rawText);
      const marks = detectTrustedMarksFromText(rawText);
      json.extracted = json.extracted || {};
      json.extracted.badges = Array.from(new Set([...(json.extracted.badges||[]), ...badges]));
      json.extracted.marks = Array.from(new Set([...(json.extracted.marks||[]), ...marks]));

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json2 = await res2.json();
      if (!res2.ok || !json2.ok) throw new Error(json2?.error || `Explain failed (${res2.status})`);
      setExplanation(json2.explanation);

      setConfidence(scoreConfidence({
        ocr: json.ocr,
        extracted: json.extracted,
        meta: json.meta,
        barcode: json.barcode || null,
        explanation: json2.explanation
      }));

    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setUploading(false);
      setExplaining(false);
    }
  }

  const isAnalyzing = uploading || explaining;
  const hasResult = !!explanation;

  // Mobile/Modern Interface
  if (shouldUseMobileInterface) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Camera View */}
        {cameraActive && (
          <div style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            background: '#000',
            aspectRatio: '4/3',
            marginBottom: 16
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                width: '80%',
                height: '60%',
                border: '3px solid #4ade80',
                borderRadius: 12,
                background: 'rgba(74, 222, 128, 0.1)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: -3,
                  left: -3,
                  right: -3,
                  bottom: -3,
                  border: '2px dashed #4ade80',
                  borderRadius: 12,
                  animation: 'pulse 2s infinite'
                }} />
              </div>
              <div style={{
                position: 'absolute',
                bottom: 120,
                textAlign: 'center',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 16 }}>Position supplement label in frame</p>
                <p style={{ margin: 0, fontSize: 14 }}>Ensure text is clear and well-lit</p>
              </div>
            </div>
            <div style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 24,
              alignItems: 'center'
            }}>
              <button
                onClick={stopCamera}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={24} />
              </button>
              <button
                onClick={capturePhoto}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'white',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  border: '4px solid #4ade80',
                  borderRadius: '50%',
                  background: 'transparent'
                }} />
              </button>
            </div>
          </div>
        )}

        {/* Canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Preview and Results */}
        {preview && !cameraActive && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <img 
                ref={imgRef} 
                src={preview} 
                alt="Preview" 
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 16,
                  border: '2px solid #23252c'
                }}
              />
              <button
                onClick={reset}
                disabled={isAnalyzing}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: isAnalyzing ? 0.5 : 1
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={upload} 
                disabled={isAnalyzing || hasResult}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '16px 24px',
                  borderRadius: 12,
                  border: 'none',
                  background: hasResult 
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                    : 'linear-gradient(135deg, #4ade80, #22c55e)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: isAnalyzing || hasResult ? 'not-allowed' : 'pointer',
                  opacity: isAnalyzing || hasResult ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  fontSize: 16
                }}
              >
                {isAnalyzing ? (
                  <>
                    <div style={{
                      width: 20,
                      height: 20,
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Analyzing...
                  </>
                ) : hasResult ? (
                  <>
                    <CheckCircle size={20} />
                    Analysis Complete
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Analyze Supplement
                  </>
                )}
              </button>
              
              <button 
                onClick={reset} 
                disabled={isAnalyzing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '16px 20px',
                  borderRadius: 12,
                  border: '2px solid #23252c',
                  background: 'transparent',
                  color: '#a2a6ad',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  opacity: isAnalyzing ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <RotateCcw size={16} />
                New Scan
              </button>
            </div>

            {file && (
              <div style={{ 
                textAlign: 'center', 
                fontSize: 12, 
                color: '#a2a6ad',
                marginTop: 8
              }}>
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
              </div>
            )}
          </div>
        )}

        {/* Upload Interface */}
        {!preview && !cameraActive && (
          <div
            style={{
              border: dragActive ? '3px dashed #4ade80' : '3px dashed #23252c',
              borderRadius: 20,
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: dragActive 
                ? 'linear-gradient(135deg, #1a2f1a 0%, #0f1a0f 100%)' 
                : 'linear-gradient(135deg, #121319 0%, #0b0c0f 100%)',
              minHeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: dragActive ? 'scale(1.02)' : 'none'
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div>
              <div style={{ 
                color: '#4ade80', 
                marginBottom: 16,
                fontSize: 48
              }}>
                <Camera size={48} />
              </div>
              <h3 style={{ 
                margin: '16px 0 8px',
                fontSize: 24,
                fontWeight: 700,
                color: '#f4f5f7'
              }}>
                Scan Supplement Label
              </h3>
              <p style={{
                margin: '0 0 24px',
                color: '#a2a6ad',
                fontSize: 16
              }}>
                Take a photo or upload an image
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                alignItems: 'center',
                marginBottom: 16
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCamera();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: 200
                  }}
                >
                  <Camera size={20} />
                  Open Camera
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px',
                    borderRadius: 12,
                    background: 'transparent',
                    color: '#a2a6ad',
                    border: '2px solid #23252c',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: 200
                  }}
                >
                  <Upload size={20} />
                  Choose File
                </button>
              </div>
              
              <p style={{
                fontSize: 14,
                color: '#6b7280',
                margin: 0
              }}>
                JPG, PNG, WEBP • Max 10MB
              </p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onInputChange}
          style={{ display: 'none' }}
        />

        {/* Error display */}
        {error && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            color: '#fca5a5',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {explanation && (
          <div style={{ marginTop: 24 }}>
            <ResultCard
              explanation={explanation}
              extracted={serverResult?.extracted}
              barcode={serverResult?.barcode || null}
              confidence={confidence}
              enhancedMode={true}
              userProfile={profile}
            />
          </div>
        )}

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  // Desktop Interface (your existing layout)
  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <label htmlFor="file" className="drop" onDrop={handleDrop} onDragOver={handleDrag}>
        <div>
          <strong>Drop an image</strong> or click to choose
          <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
            JPG / PNG / WEBP · Max 10MB
          </div>
        </div>
        <input ref={inputRef} id="file" type="file" accept={accept} onChange={onInputChange} style={{ display: "none" }} />
      </label>

      {error && <p className="error">{error}</p>}

      {preview && (
        <div className="split" style={{ marginTop: 16 }}>
          <div className="left">
            <img ref={imgRef} src={preview} alt="Preview" className="preview-small" />
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
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type}
              </div>
            )}
          </div>

          <div className="right">
            {explanation ? (
              <ResultCard
                explanation={explanation}
                extracted={serverResult?.extracted}
                barcode={serverResult?.barcode || null}
                confidence={confidence}
                enhancedMode={false}
                userProfile={profile}
              />
            ) : (
              <div className="card" style={{ minHeight: 140, display: "grid", placeItems: "center", color: "var(--muted)" }}>
                {explaining ? "Generating summary…" : "Click Analyze to generate guidance."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}