// src/app/[locale]/loading.tsx
export default function Loading() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mb-4" />
      <p style={{ fontSize: '1.2rem', color: '#666' }}>Loading...</p>
    </div>
  );
} 