// src/components/HistoryPanel.tsx - ENHANCED VERSION
"use client";
import React, { useState } from "react";
import { useHistoryStore } from "@/lib/history";

export default function HistoryPanel() {
  const { items, remove, clear } = useHistoryStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [justCleared, setJustCleared] = useState(false);

  const handleClear = () => {
    if (showConfirm) {
      clear();
      setShowConfirm(false);
      setJustCleared(true);
      
      // Show "cleared" message for 3 seconds
      setTimeout(() => {
        setJustCleared(false);
      }, 3000);
    } else {
      setShowConfirm(true);
      
      // Auto-cancel confirmation after 5 seconds
      setTimeout(() => {
        setShowConfirm(false);
      }, 5000);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="section-title" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px"
      }}>
        <span style={{ color: '#f4f5f7' }}>History</span>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {justCleared && (
            <span style={{
              color: '#22c55e',
              fontSize: '12px',
              fontWeight: '500',
              background: 'rgba(34, 197, 94, 0.1)',
              padding: '4px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              ✓ Cleared
            </span>
          )}
          
          {showConfirm ? (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ 
                fontSize: '12px', 
                color: '#f59e0b',
                fontWeight: '500'
              }}>
                Clear all?
              </span>
              <button 
                onClick={handleClear}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Yes
              </button>
              <button 
                onClick={handleCancel}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: '1px solid #23252c',
                  background: 'transparent',
                  color: '#a2a6ad',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={handleClear}
              disabled={!items.length || justCleared}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                border: '1px solid #23252c',
                background: 'transparent',
                color: items.length ? '#a2a6ad' : '#6b7280',
                borderRadius: '6px',
                cursor: items.length ? 'pointer' : 'not-allowed',
                opacity: justCleared ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {justCleared && !items.length ? (
        <div style={{
          textAlign: 'center',
          padding: '24px',
          color: '#22c55e',
          background: 'rgba(34, 197, 94, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          fontSize: '14px'
        }}>
          <div style={{ marginBottom: '8px', fontSize: '24px' }}>🗑️</div>
          <strong>History cleared!</strong>
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#86efac' }}>
            New scans won't be saved for 1 minute
          </div>
        </div>
      ) : !items.length ? (
        <div style={{ color: '#a2a6ad', textAlign: 'center', padding: '16px' }}>
          No scans saved yet.
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", 
          gap: 12 
        }}>
          {items.map(i => (
            <div 
              key={i.id} 
              style={{
                padding: 12,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid #23252c',
                borderRadius: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4ade80';
                e.currentTarget.style.background = 'rgba(74, 222, 128, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#23252c';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              }}
            >
              {i.imgDataUrl && (
                <img 
                  src={i.imgDataUrl} 
                  alt="" 
                  style={{
                    width: "100%", 
                    borderRadius: 8,
                    border: '1px solid #23252c',
                    aspectRatio: '1',
                    objectFit: 'cover'
                  }}
                />
              )}
              <div style={{ 
                marginTop: 8, 
                fontWeight: 600, 
                fontSize: '13px',
                color: '#f4f5f7',
                lineHeight: '1.3'
              }}>
                {i.brand || "Unknown"} — {i.product || "Product"}
              </div>
              {i.barcode && (
                <div style={{
                  fontSize: 10,
                  color: '#a2a6ad',
                  marginTop: '4px',
                  fontFamily: 'monospace'
                }}>
                  {i.barcode.slice(0, 12)}...
                </div>
              )}
              <div style={{
                display: 'flex',
                gap: '6px',
                marginTop: 8,
                flexWrap: 'wrap'
              }}>
                <a 
                  href={`/report?id=${encodeURIComponent(i.id)}`}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    fontSize: '11px',
                    border: '1px solid #4ade80',
                    background: 'rgba(74, 222, 128, 0.1)',
                    color: '#4ade80',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
                  }}
                >
                  Report
                </a>
                <button 
                  onClick={() => remove(i.id)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    fontSize: '11px',
                    border: '1px solid #ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  Remove
                </button>
              </div>
              <div style={{
                fontSize: '10px',
                color: '#6b7280',
                marginTop: '6px',
                textAlign: 'center'
              }}>
                {new Date(i.when).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}