import { useState, useEffect, useRef } from 'react';
import { getSetting, setSetting, getCategoryBudgets, setCategoryBudget,
  getSyncCode, setSyncCode, initSyncCode, pullFromCloud } from '../db/storage';
import { useData } from '../context/DataContext';
import { CATEGORIES } from '../constants/categories';
import { isConfigured } from '../db/firebaseConfig';

export default function Settings() {
  const { refresh } = useData();
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [catBudgets, setCatBudgets]       = useState({});
  const [saved, setSaved]                 = useState(false);
  const [syncCode, setSyncCodeState]      = useState('');
  const [inputCode, setInputCode]         = useState('');
  const [syncing, setSyncing]             = useState(false);
  const [syncMsg, setSyncMsg]             = useState('');

  useEffect(() => {
    async function load() {
      const b = await getSetting('monthlyBudget');
      if (b) setMonthlyBudget(String(b));
      const cb = await getCategoryBudgets();
      const map = {};
      cb.forEach((x) => { map[x.categoryId] = x.limit; });
      setCatBudgets(map);
      const code = await initSyncCode();
      setSyncCodeState(code);
      setInputCode(code);
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    await setSetting('monthlyBudget', parseFloat(monthlyBudget) || 0);
    for (const [catId, limit] of Object.entries(catBudgets)) {
      await setCategoryBudget(catId, parseFloat(limit) || 0);
    }
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  async function handleApplyCode() {
    const code = inputCode.toUpperCase().trim();
    if (code.length < 4) return;
    await setSyncCode(code);
    setSyncCodeState(code);
    setSyncing(true);
    setSyncMsg('');
    const ok = await pullFromCloud();
    if (ok) await refresh();
    setSyncing(false);
    setSyncMsg(ok
      ? '✓ Date sincronizate!'
      : isConfigured ? '⚠ Nicio dată pentru acest cod.' : '⚠ Firebase neconfigurat.');
    setTimeout(() => setSyncMsg(''), 3000);
  }

  function copyCode() {
    navigator.clipboard?.writeText(syncCode).catch(() => {});
    setSyncMsg('✓ Cod copiat!');
    setTimeout(() => setSyncMsg(''), 2000);
  }

  const budget = parseFloat(monthlyBudget) || 0;

  return (
    <div className="page">
      <div style={{ fontWeight:800, fontSize:22, marginBottom:20, letterSpacing:'-0.5px' }}>Setări</div>

      <form onSubmit={handleSave}>
        {/* Monthly budget */}
        <div className="glass anim-fade-up" style={{ padding:'20px', marginBottom:14 }}>
          <div className="section-label">Buget lunar total</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginBottom:10 }}>
            Suma maximă per lună. Lasă 0 pentru fără limită.
          </div>
          <input type="number" placeholder="ex. 3000" min="0" step="50"
            value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)}
            style={{ fontSize:24, fontWeight:700, textAlign:'center' }} />
        </div>

        {/* Category budgets */}
        <div className="glass anim-fade-up" style={{ padding:'20px', marginBottom:20 }}>
          <div className="section-label">Limite per categorie</div>
          <div style={{ fontSize:13, color:'var(--text3)', marginBottom:14 }}>
            Opțional — dacă ai buget lunar, se calculează automat.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {CATEGORIES.map((cat) => {
              const suggested = budget && cat.suggestedPct > 0
                ? Math.round(budget * cat.suggestedPct / 100) : 0;
              return (
                <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:40, height:40, borderRadius:12, fontSize:20, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background:`${cat.color}18`,
                  }}>{cat.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600 }}>{cat.name}</div>
                    {cat.suggestedPct > 0 && (
                      <div style={{ fontSize:11, color:'var(--text3)' }}>
                        Sugestie {cat.suggestedPct}%{suggested > 0 ? ` = ${suggested} RON` : ''}
                      </div>
                    )}
                  </div>
                  <input type="number" min="0" step="50"
                    placeholder={suggested > 0 ? String(suggested) : '—'}
                    value={catBudgets[cat.id] || ''}
                    onChange={(e) => setCatBudgets((p) => ({ ...p, [cat.id]: e.target.value }))}
                    style={{ width:110, textAlign:'right', padding:'9px 12px' }} />
                </div>
              );
            })}
          </div>
        </div>

        <button type="submit" className="btn btn-primary"
          style={{ width:'100%', fontSize:16, borderRadius:16, padding:'15px' }}>
          {saved ? '✓ Salvat!' : 'Salvează setările'}
        </button>
      </form>

      {/* Sync */}
      <div className="glass anim-fade-up" style={{ marginTop:14, padding:'20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:20 }}>☁️</span>
          <div className="section-label" style={{ marginBottom:0 }}>Sincronizare</div>
          {!isConfigured && (
            <span className="badge badge-yellow" style={{ marginLeft:'auto' }}>Inactiv</span>
          )}
          {isConfigured && (
            <span className="badge badge-green" style={{ marginLeft:'auto' }}>Activ</span>
          )}
        </div>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:16, lineHeight:1.6 }}>
          Același cod pe ambele dispozitive → date sincronizate automat.
        </div>

        <div style={{ marginBottom:12 }}>
          <div className="section-label">Codul tău</div>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{
              flex:1, padding:'13px 16px', borderRadius:'var(--radius-sm)',
              background:'var(--surface2)', border:'1.5px solid var(--border2)',
              fontWeight:800, fontSize:22, letterSpacing:'0.2em',
              color:'var(--violet2)', textAlign:'center',
            }}>
              {syncCode || '——'}
            </div>
            <button className="btn btn-ghost" onClick={copyCode} style={{ padding:'12px 16px', flexShrink:0 }}>
              📋
            </button>
          </div>
        </div>

        <div className="section-label">Schimbă codul</div>
        <div style={{ display:'flex', gap:8 }}>
          <input type="text" placeholder="Ex. A1B2C3"
            value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            maxLength={8} style={{ flex:1, letterSpacing:'0.15em', fontWeight:700, textAlign:'center' }} />
          <button className="btn btn-primary" onClick={handleApplyCode}
            disabled={syncing} style={{ flexShrink:0, padding:'12px 16px' }}>
            {syncing ? '⏳' : 'Aplică'}
          </button>
        </div>
        {syncMsg && (
          <div style={{ marginTop:10, fontSize:13, fontWeight:600,
            color: syncMsg.includes('✓') ? 'var(--green)' : 'var(--yellow)' }}>
            {syncMsg}
          </div>
        )}
      </div>
    </div>
  );
}
