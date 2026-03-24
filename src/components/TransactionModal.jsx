import { useState, useEffect } from 'react';
import { CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

const EMPTY = {
  type: 'cheltuiala',
  amount: '',
  category: 'mancare',
  description: '',
  date: new Date().toISOString().slice(0, 10),
};

export default function TransactionModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(initial
      ? { ...initial, amount: String(initial.amount) }
      : { ...EMPTY, date: new Date().toISOString().slice(0, 10) }
    );
  }, [initial]);

  const cats = form.type === 'cheltuiala' ? CATEGORIES : INCOME_CATEGORIES;

  function set(key, val) {
    setForm((f) => ({
      ...f,
      [key]: val,
      ...(key === 'type' ? { category: val === 'cheltuiala' ? 'mancare' : 'salariu' } : {}),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;
    onSave({ ...form, amount });
  }

  const isExpense = form.type === 'cheltuiala';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-slide-up"
        style={{
          width: '100%', maxWidth: 480,
          background: '#0f1128',
          border: '1px solid var(--border2)',
          borderBottom: 'none',
          borderRadius: '28px 28px 0 0',
          padding: '0 20px calc(20px + var(--safe-bottom))',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'14px 0 20px' }}>
          <div style={{ width:40, height:4, borderRadius:99, background:'var(--border2)' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <h2 style={{ fontSize:18, fontWeight:700 }}>
            {initial ? 'Editează' : 'Tranzacție nouă'}
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ fontSize:18 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {/* Type */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { val:'cheltuiala', label:'📤 Cheltuială', activeColor:'var(--red)' },
              { val:'venit',      label:'📥 Venit',      activeColor:'var(--green)' },
            ].map(({ val, label, activeColor }) => (
              <button
                key={val} type="button"
                onClick={() => set('type', val)}
                style={{
                  padding: '13px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600, fontSize: 14,
                  border: form.type === val ? `1.5px solid ${activeColor}` : '1.5px solid var(--border)',
                  background: form.type === val ? `${activeColor}18` : 'var(--surface)',
                  color: form.type === val ? activeColor : 'var(--text2)',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Sumă (RON)
            </div>
            <input
              type="number" placeholder="0" min="0.01" step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              required autoFocus
              style={{ fontSize:28, fontWeight:700, textAlign:'center', letterSpacing:'-0.5px' }}
            />
          </div>

          {/* Categories */}
          <div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Categorie
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
              {cats.map((cat) => {
                const active = form.category === cat.id;
                return (
                  <button
                    key={cat.id} type="button"
                    onClick={() => set('category', cat.id)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11, fontWeight: 600,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      border: active ? `1.5px solid ${cat.color}` : '1.5px solid transparent',
                      background: active ? `${cat.color}20` : 'var(--surface)',
                      color: active ? cat.color : 'var(--text2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Descriere (opțional)
            </div>
            <input
              type="text" placeholder="ex. Kaufland, benzină..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={80}
            />
          </div>

          {/* Date */}
          <div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Data
            </div>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Anulează</button>
            <button type="submit" className="btn btn-primary">
              {initial ? 'Salvează' : 'Adaugă'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
