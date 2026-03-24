import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard    from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Statistics   from './pages/Statistics';
import Settings     from './pages/Settings';
import { DataProvider, useData } from './context/DataContext';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

const NAV = [
  { to: '/',           icon: HomeIcon,  label: 'Acasă'      },
  { to: '/tranzactii', icon: CardIcon,  label: 'Tranzacții' },
  { to: '/statistici', icon: ChartIcon, label: 'Statistici' },
  { to: '/setari',     icon: GearIcon,  label: 'Setări'     },
];

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </DataProvider>
  );
}

function AppShell() {
  const { loading } = useData();

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <div style={{ flex:1 }}>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/tranzactii" element={<Transactions />} />
          <Route path="/statistici" element={<Statistics />} />
          <Route path="/setari"     element={<Settings />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 'calc(var(--nav-h) + var(--safe-bottom))',
      paddingBottom: 'var(--safe-bottom)',
      display: 'flex',
      background: 'rgba(8,9,26,0.85)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      borderTop: '1px solid var(--border)',
      zIndex: 100,
    }}>
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 600,
            color: isActive ? 'var(--violet2)' : 'var(--text3)',
            transition: 'color 0.2s',
            letterSpacing: '0.02em',
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '12px',
                background: isActive ? 'rgba(139,92,246,0.18)' : 'transparent',
                transition: 'background 0.2s',
              }}>
                <Icon size={20} active={isActive} />
              </div>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────
function HomeIcon({ size = 20, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
        fill={active ? 'var(--violet2)' : 'none'}
        stroke={active ? 'var(--violet2)' : 'var(--text3)'}
        strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CardIcon({ size = 20, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3"
        stroke={active ? 'var(--violet2)' : 'var(--text3)'} strokeWidth="1.8" />
      <path d="M2 10H22"
        stroke={active ? 'var(--violet2)' : 'var(--text3)'} strokeWidth="1.8" />
      <rect x="5" y="14" width="4" height="2" rx="1"
        fill={active ? 'var(--violet2)' : 'var(--text3)'} />
    </svg>
  );
}

function ChartIcon({ size = 20, active }) {
  const c = active ? 'var(--violet2)' : 'var(--text3)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3"  y="12" width="4" height="9" rx="1.5" fill={c} opacity="0.7" />
      <rect x="10" y="7"  width="4" height="14" rx="1.5" fill={c} />
      <rect x="17" y="3"  width="4" height="18" rx="1.5" fill={c} opacity="0.7" />
    </svg>
  );
}

function GearIcon({ size = 20, active }) {
  const c = active ? 'var(--violet2)' : 'var(--text3)';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
