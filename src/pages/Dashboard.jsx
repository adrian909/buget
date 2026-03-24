import { useState } from 'react';
import { addTransaction } from '../db/storage';
import { useData } from '../context/DataContext';
import { CATEGORIES, getCategoryById } from '../constants/categories';
import TransactionModal from '../components/TransactionModal';

const MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
  'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];

function fmt(n) {
  return new Intl.NumberFormat('ro-RO', { style:'currency', currency:'RON', maximumFractionDigits:0 }).format(n);
}

function getBudgetStatus(spent, limit) {
  if (!limit) return null;
  const pct = (spent / limit) * 100;
  if (pct >= 100) return { pct, cls:'badge-red',    label:'Depășit', dot:'🔴' };
  if (pct >= 80)  return { pct, cls:'badge-yellow', label:'Aproape', dot:'🟡' };
  return               { pct, cls:'badge-green',  label:'OK',      dot:'🟢' };
}

export default function Dashboard() {
  const now = new Date();
  const { transactions, monthlyBudget: budget, catBudgets: catLimits, refresh } = useData();
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [showModal, setShowModal] = useState(false);

  function navMonth(dir) {
    let m = month + dir, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  // Filtrare locală din contextul global
  const monthTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const cheltuieli      = monthTxs.filter((t) => t.type === 'cheltuiala');
  const venituri        = monthTxs.filter((t) => t.type === 'venit');
  const totalCheltuieli = cheltuieli.reduce((s, t) => s + t.amount, 0);
  const totalVenituri   = venituri.reduce((s, t)   => s + t.amount, 0);
  const baza            = budget || totalVenituri;
  const ramas           = baza - totalCheltuieli;
  const totalPct        = baza > 0 ? Math.min((totalCheltuieli / baza) * 100, 100) : 0;
  const totalStatus     = baza > 0 ? getBudgetStatus(totalCheltuieli, baza) : null;
  const barColor        = totalStatus
    ? totalStatus.pct >= 100 ? 'var(--red)' : totalStatus.pct >= 80 ? 'var(--yellow)' : 'var(--green)'
    : 'var(--violet)';

  // ── Economii inteligente ──────────────────────────────────────────────────
  const economiiSum = cheltuieli
    .filter((t) => t.category === 'economii')
    .reduce((s, t) => s + t.amount, 0);

  const budgetRef       = budget || totalVenituri;
  const effectiveBudget = budgetRef > 0 ? Math.max(0, budgetRef - economiiSum) : 0;
  const savingsRatio    = budgetRef > 0 && economiiSum > 0 ? effectiveBudget / budgetRef : 1;
  const hasSavings      = economiiSum > 0;

  const byCat = CATEGORIES.map((cat) => {
    const sum = cheltuieli.filter((t) => t.category === cat.id).reduce((s, t) => s + t.amount, 0);
    if (cat.id === 'economii') {
      return { ...cat, sum, limit: catLimits['economii'] || 0, isManual: !!catLimits['economii'] };
    }
    const rawManual    = catLimits[cat.id] || 0;
    const rawSuggested = budget && cat.suggestedPct > 0 ? (budget * cat.suggestedPct) / 100 : 0;
    const rawLimit     = rawManual || rawSuggested;
    const limit        = rawLimit > 0 ? rawLimit * savingsRatio : 0;
    return { ...cat, sum, limit, isManual: rawManual > 0, wasAdjusted: hasSavings && rawLimit > 0 };
  }).filter((c) => c.sum > 0 || c.limit > 0).sort((a, b) => b.sum - a.sum);

  async function handleSave(form) {
    await addTransaction(form);
    await refresh();
    setShowModal(false);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navMonth(-1)}
          style={{ fontSize:20, color:'var(--text2)' }}>‹</button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontWeight:700, fontSize:16 }}>{MONTHS[month]} {year}</div>
          {isCurrentMonth && (
            <div style={{ fontSize:11, color:'var(--violet2)', fontWeight:600, letterSpacing:'0.05em' }}>
              ● LUNA CURENTĂ
            </div>
          )}
        </div>
        <button className="btn btn-ghost btn-icon" onClick={() => navMonth(1)}
          style={{ fontSize:20, color:'var(--text2)' }}>›</button>
      </div>

      {/* Hero card */}
      <div className="glass anim-fade-up" style={{
        marginBottom:16, padding:'24px 20px',
        background:'linear-gradient(145deg, rgba(124,58,237,0.18) 0%, rgba(139,92,246,0.08) 100%)',
        border:'1px solid rgba(139,92,246,0.25)', position:'relative', overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', top:-40, right:-40, width:150, height:150,
          background:'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
          pointerEvents:'none',
        }} />
        <div style={{ textAlign:'center', marginBottom:20, position:'relative' }}>
          <div style={{ fontSize:12, color:'var(--text2)', fontWeight:600, letterSpacing:'0.08em',
            textTransform:'uppercase', marginBottom:8 }}>
            {budget ? 'Rămas din buget' : 'Economii luna aceasta'}
          </div>
          <div style={{
            fontSize:44, fontWeight:800, letterSpacing:'-1.5px',
            color: ramas >= 0 ? 'var(--green)' : 'var(--red)',
            textShadow: ramas >= 0 ? 'var(--green-glow)' : 'var(--red-glow)',
          }}>
            {fmt(ramas)}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1px 1fr 1px 1fr', gap:0, marginBottom: baza > 0 ? 20 : 0 }}>
          <StatItem label="Venituri"   value={fmt(totalVenituri)}   color="var(--green)" />
          <div style={{ background:'var(--border)', margin:'4px 0' }} />
          <StatItem label="Cheltuieli" value={fmt(totalCheltuieli)} color="var(--red)" />
          <div style={{ background:'var(--border)', margin:'4px 0' }} />
          <StatItem label={budget ? 'Buget' : 'Sold'} value={fmt(baza)} color="var(--text2)" />
        </div>
        {baza > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:12, color:'var(--text2)' }}>{totalPct.toFixed(0)}% utilizat</span>
              {totalStatus && (
                <span className={`badge ${totalStatus.cls}`}>
                  {totalStatus.dot} {totalStatus.label}
                </span>
              )}
            </div>
            <div className="progress-track" style={{ height:6 }}>
              <div className="progress-fill" style={{ width:`${totalPct}%`, background:barColor }} />
            </div>
          </div>
        )}
      </div>

      {/* Savings banner */}
      {hasSavings && (
        <div className="anim-fade-up" style={{
          marginBottom:12, padding:'14px 16px', borderRadius:16,
          background:'linear-gradient(135deg, rgba(0,229,160,0.10) 0%, rgba(0,229,160,0.04) 100%)',
          border:'1px solid rgba(0,229,160,0.25)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: budgetRef > 0 ? 10 : 0 }}>
            <div style={{ fontSize:28, flexShrink:0 }}>💰</div>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'var(--green)' }}>
                Economii luna aceasta: {fmt(economiiSum)}
              </div>
              {budgetRef > 0 && (
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
                  Limitele categoriilor s-au redus cu{' '}
                  <strong style={{ color:'var(--yellow)' }}>
                    {((1 - savingsRatio) * 100).toFixed(0)}%
                  </strong>
                </div>
              )}
            </div>
          </div>
          {budgetRef > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:'8px 12px', textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>Buget total</div>
                <div style={{ fontWeight:700, fontSize:14 }}>{fmt(budgetRef)}</div>
              </div>
              <div style={{ background:'rgba(0,229,160,0.1)', borderRadius:10, padding:'8px 12px', textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>Disponibil cheltuieli</div>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--green)' }}>{fmt(effectiveBudget)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add button */}
      <button className="btn btn-primary anim-fade-up"
        style={{ width:'100%', marginBottom:16, fontSize:16, borderRadius:16, padding:'15px' }}
        onClick={() => setShowModal(true)}>
        <span style={{ fontSize:20 }}>+</span> Adaugă tranzacție
      </button>

      {/* Category breakdown */}
      {byCat.length > 0 && (
        <div className="anim-fade-up" style={{ marginBottom:16 }}>
          <div className="section-label">Cheltuieli pe categorii</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {byCat.map((cat) => {
              const status = cat.limit > 0 ? getBudgetStatus(cat.sum, cat.limit) : null;
              const over   = status && status.pct >= 100;
              const barW   = cat.limit > 0 ? Math.min((cat.sum / cat.limit) * 100, 100) : 100;
              const barC   = !status ? cat.color
                : over ? 'var(--red)' : status.pct >= 80 ? 'var(--yellow)' : 'var(--green)';

              return (
                <div key={cat.id} className="glass" style={{
                  padding:'14px 16px',
                  border: over ? '1px solid rgba(255,69,103,0.3)' : '1px solid var(--border)',
                  background: over ? 'rgba(255,69,103,0.06)' : 'var(--surface)',
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:38, height:38, borderRadius:12, fontSize:20,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background:`${cat.color}20`,
                      }}>{cat.icon}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14 }}>{cat.name}</div>
                        <div style={{ display:'flex', gap:4, marginTop:2, flexWrap:'wrap' }}>
                          {status && <span className={`badge ${status.cls}`}>{status.dot} {status.label}</span>}
                          {cat.wasAdjusted && (
                            <span className="badge" style={{ background:'rgba(251,191,36,0.12)', color:'var(--yellow)' }}>
                              ↘ ajustat
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, fontSize:15, color: over ? 'var(--red)' : 'var(--text)' }}>
                        {fmt(cat.sum)}
                      </div>
                      {cat.limit > 0 && (
                        <div style={{ fontSize:12, color:'var(--text3)' }}>din {fmt(cat.limit)}</div>
                      )}
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width:`${barW}%`, background:barC }} />
                  </div>
                  {cat.limit > 0 && (
                    <div style={{ marginTop:5, fontSize:11, color:'var(--text3)' }}>
                      {over
                        ? <span style={{ color:'var(--red)', fontWeight:600 }}>⚠ Depășit cu {fmt(cat.sum - cat.limit)}</span>
                        : <span>Rămas: <span style={{ color:'var(--green)', fontWeight:600 }}>{fmt(cat.limit - cat.sum)}</span>
                            {!cat.isManual && cat.suggestedPct > 0 && (
                              <span style={{ color:'var(--text3)' }}> · sugestie {cat.suggestedPct}%</span>
                            )}
                          </span>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {monthTxs.length > 0 && (
        <div className="anim-fade-up" style={{ marginBottom:8 }}>
          <div className="section-label">Recente</div>
          <div className="glass" style={{ padding:0, overflow:'hidden' }}>
            {monthTxs.slice(0, 6).map((tx, i) => {
              const cat = getCategoryById(tx.category);
              return (
                <div key={tx.id} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                  borderBottom: i < Math.min(monthTxs.length, 6) - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width:42, height:42, borderRadius:14, fontSize:20, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background:`${cat.color}18`,
                  }}>{cat.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {tx.description || cat.name}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('ro-RO', { day:'numeric', month:'short' })}
                    </div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:15, flexShrink:0,
                    color: tx.type === 'venit' ? 'var(--green)' : 'var(--red)' }}>
                    {tx.type === 'venit' ? '+' : '−'}{fmt(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {monthTxs.length === 0 && (
        <div style={{ textAlign:'center', padding:'56px 24px', color:'var(--text3)' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>💸</div>
          <div style={{ fontWeight:700, fontSize:17, color:'var(--text2)', marginBottom:6 }}>Nicio tranzacție</div>
          <div style={{ fontSize:14 }}>Apasă + pentru a adăuga prima înregistrare</div>
        </div>
      )}

      {showModal && (
        <TransactionModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}

function StatItem({ label, value, color }) {
  return (
    <div style={{ textAlign:'center', padding:'0 8px' }}>
      <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600,
        letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:5 }}>{label}</div>
      <div style={{ fontWeight:700, fontSize:15, color }}>{value}</div>
    </div>
  );
}
