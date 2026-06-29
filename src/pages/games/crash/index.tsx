// pages/games/crash/index.tsx
import dynamic from 'next/dynamic';

function CrashSkeleton() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0606',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: "'Courier New', monospace",
      }}
    >
      <span style={{ fontSize: 40 }}>✈</span>
      <div style={{ color: '#e63946', fontSize: 16, fontWeight: 700, letterSpacing: '0.15em' }}>
        AVIATOR
      </div>
      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Loading…</div>
    </div>
  );
}

const CrashGame = dynamic(() => import('./CrashGame'), {
  ssr:     false,
  loading: () => <CrashSkeleton />,
});

export default function CrashPage() {
  return <CrashGame />;
}