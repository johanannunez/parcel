export default function Loading() {
  return (
    <div style={{ padding: '0' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 62,
              borderTop: i === 0 ? 'none' : '1px solid #f3f4f6',
              background: 'linear-gradient(90deg, #fafbfc 25%, #f5f7fa 50%, #fafbfc 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s ease-in-out infinite',
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
