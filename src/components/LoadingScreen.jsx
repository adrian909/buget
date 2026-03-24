import logoImg from '../assets/logo.png';

export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#08091a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 999,
    }}>
      {/* Glow radial */}
      <div style={{
        position: 'absolute',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <img
          src={logoImg}
          alt="Buget Personal"
          style={{
            width: 100, height: 100, borderRadius: 28,
            boxShadow: '0 8px 40px rgba(124,58,237,0.5)',
            animation: 'pulse 2s ease-in-out infinite',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Title */}
      <div style={{
        fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px',
        background: 'linear-gradient(135deg, #a78bfa, #e8eaff)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: 8,
      }}>
        Buget Personal
      </div>
      <div style={{ fontSize: 14, color: 'rgba(232,234,255,0.4)', marginBottom: 48 }}>
        Se încarcă datele...
      </div>

      {/* Animated bar */}
      <div style={{
        width: 160, height: 3, borderRadius: 99,
        background: 'rgba(255,255,255,0.07)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, transparent, #8b5cf6, #a78bfa, transparent)',
          backgroundSize: '200% 100%',
          animation: 'shimmerBar 1.4s ease infinite',
        }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 8px 40px rgba(124,58,237,0.5); }
          50%       { transform: scale(1.06); box-shadow: 0 12px 56px rgba(124,58,237,0.7); }
        }
        @keyframes shimmerBar {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>
    </div>
  );
}
