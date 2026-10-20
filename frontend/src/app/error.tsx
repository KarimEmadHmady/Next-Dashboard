// src/app/error.tsx
'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Log the error if needed
    // console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ fontSize: '2rem', color: '#d32f2f', marginBottom: 16 }}>Something went wrong</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>{error?.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={() => reset()}
        style={{ padding: '8px 24px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, fontSize: '1rem', cursor: 'pointer' }}
      >
        Reload Page
      </button>
    </div>
  );
} 