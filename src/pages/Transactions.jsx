import { useState } from 'react';
import { addTransaction, updateTransaction, deleteTransaction } from '../db/storage';
import { useData } from '../context/DataContext';
import { getCategoryById } from '../constants/categories';
import TransactionModal from '../components/TransactionModal';

const MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
  'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];

function fmt(n) {
  return new Intl.NumberFormat('ro-RO', { style:'currency', currency:'RON', maximumFractionDigits:0 }).format(n);
}

export default function Transactions() {
  const now = new Date();
  const { transactions, refresh } = useData();
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [filter, setFilter]   = useState('toate');
  const [search, setSearch]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleting, setDeleting]   = useState(null);

  function navMonth(dir) {
    let m = month + dir, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  const monthTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const filtered = monthTxs.filter((t) => {
    if (filter !== 'toate' && t.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const cat = getCategoryById(t.category);
      return (t.description || '').toLowerCase().includes(q) || cat.name.toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = filtered.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalCheltuieli = filtered.filter(t => t.type === 'cheltuiala').reduce((s, t) => s + t.amount, 0);
  const totalVenituri   = filtered.filter(t => t.type === 'venit').reduce((s, t) => s + t.amount, 0);

  async function handleSave(form) {
    if (editing) await updateTransaction({ ...form, id: editing.id });
    else         await addTransaction(form);
    await refresh();
    setShowModal(false);
    setEditing(null);
  }

  async function handleDelete(id) {
    await deleteTransaction(id);
    await refresh();
    setDeleting(null);
  }

  return (
    <div className="page">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navMonth(-1)}
          style={{ fontSize:20, color:'var(--text2)' }}>‹</button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontWeight:700, fontSize:16 }}>{MONTHS[month]} {year}</div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>{filtered.length} tranzacții</div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={() => navMonth(1)}
          style={{ fontSize:20, color:'var(--text2)' }}>›</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
        {[
          { label:'Venituri',   value:fmt(totalVenituri),   color:'var(--green)' },
          { label:'Cheltuieli', value:fmt(totalCheltuieli), color:'var(--red)'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{label}</div>
            <div style={{ fontWeight:700, fontSize:17, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input type="text" placeholder="Caută..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ flex:1 }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          style={{ width:'auto', minWidth:120 }}>
          <option value="toate">Toate</option>
          <option value="cheltuiala">Cheltuieli</option>
          <option value="venit">Venituri</option>
        </select>
      </div>

      <button className="btn btn-primary" style={{ width:'100%', marginBottom:16, borderRadius:14 }}
        onClick={() => { setEditing(null); setShowModal(true); }}>
        <span style={{ fontSize:18 }}>+</span> Adaugă
      </button>

      {dates.length === 0 ? (
        <div style={{ textAlign:'center', padding:'56px 20px', color:'var(--text3)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
          <div style={{ fontWeight:700, fontSize:16, color:'var(--text2)', marginBottom:6 }}>
            {search || filter !== 'toate' ? 'Nicio tranzacție găsită' : 'Nicio tranzacție'}
          </div>
        </div>
      ) : (
        <div className="anim-fade-up">
          {dates.map((date) => (
            <div key={date} style={{ marginBottom:16 }}>
              <div className="section-label">
                {new Date(date + 'T00:00:00').toLocaleDateString('ro-RO', {
                  weekday:'long', day:'numeric', month:'long',
                })}
              </div>
              <div className="glass" style={{ padding:0, overflow:'hidden' }}>
                {grouped[date].map((tx, i) => {
                  const cat = getCategoryById(tx.category);
                  return (
                    <div key={tx.id} style={{
                      display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
                      borderBottom: i < grouped[date].length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{
                        width:44, height:44, borderRadius:14, fontSize:21, flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        background:`${cat.color}18`,
                      }}>{cat.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:14, overflow:'hidden',
                          textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {tx.description || cat.name}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text3)' }}>{cat.name}</div>
                      </div>
                      <div style={{ fontWeight:700, fontSize:15, flexShrink:0,
                        color: tx.type === 'venit' ? 'var(--green)' : 'var(--red)' }}>
                        {tx.type === 'venit' ? '+' : '−'}{fmt(tx.amount)}
                      </div>
                      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                        <button className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => { setEditing(tx); setShowModal(true); }}>✏️</button>
                        <button className="btn btn-danger btn-icon btn-sm"
                          onClick={() => setDeleting(tx.id)}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleting && (
        <div onClick={() => setDeleting(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
          backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:300,
        }}>
          <div onClick={(e) => e.stopPropagation()} className="glass-strong anim-scale-in"
            style={{ maxWidth:320, width:'calc(100% - 40px)', padding:'32px 24px', textAlign:'center', borderRadius:24 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🗑️</div>
            <div style={{ fontWeight:700, fontSize:17, marginBottom:8 }}>Ștergi tranzacția?</div>
            <div style={{ fontSize:14, color:'var(--text2)', marginBottom:24 }}>Această acțiune nu poate fi anulată.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Anulează</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleting)}>Șterge</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <TransactionModal
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
          initial={editing}
        />
      )}
    </div>
  );
}
