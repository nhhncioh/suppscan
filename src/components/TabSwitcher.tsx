"use client";
import { useState, useEffect } from 'react';

export default function TabSwitcher() {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'red',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <div>TAB SWITCHER LOADED!</div>
      <button 
        onClick={() => alert('Symptoms clicked!')}
        style={{
          marginTop: '10px',
          padding: '10px',
          background: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Switch to Symptoms View
      </button>
    </div>
  );
}