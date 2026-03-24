import { useState } from 'react';
import { useData } from '../context/DataContext';
import { CATEGORIES, getCategoryById } from '../constants/categories';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const MONTHS_SHORT = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec'];

function fmt(n) {
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits:0 }).format(n) + ' RON';
}

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0f1128', border:'1px solid var(--border2)',
      borderRadius:10, padding:'8px 14px', fontSize:13 }}>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text)' }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function Statistics() {
  const { transactions } = useData();
  const [activeIdx, setActiveIdx] = useState(null);
  const now = new Date();

  const thisMonthExp = transactions.filter((t) => {
    const d = new Date(t.date);
    return t.type === 'cheltuiala' && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const pieData = CATEGORIES.map((cat) => ({
    name: `${cat.icon} ${cat.name}`,
    value: thisMonthExp.filter((t) => t.category === cat.id).reduce((s, t) => s + t.amount, 0),
    color: cat.color,
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const y = d.getFullYear(), m = d.getMonth();
    const mo = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getFullYear() === y && td.getMonth() === m;
    });
    return {
      name: MONTHS_SHORT[m],
      Venituri:   mo.filter(t => t.type === 'venit').reduce((s,t) => s+t.amount, 0),
      Cheltuieli: mo.filter(t => t.type === 'cheltuiala').reduce((s,t) => s+t.amount, 0),
    };
  });

  const allExp        = transactions.filter(t => t.type === 'cheltuiala');
  const totalAllTime  = allExp.reduce((s, t) => s + t.amount, 0);
  const topCats       = CATEGORIES.map((cat) => ({
    ...cat,
    sum: allExp.filter(t => t.category === cat.id).reduce((s,t) => s+t.amount, 0),
  })).filter(c => c.sum > 0).sort((a,b) => b.sum - a.sum).slice(0, 5);

  const months       = new Set(allExp.map(t => t.date.slice(0,7)));
  const avgMonthly   = months.size ? totalAllTime / months.size : 0;
  const maxTx        = [...allExp].sort((a,b) => b.amount - a.amount)[0];

  if (!transactions.length) return (
    <div className="page" style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'70vh' }}>
      <div style={{ fontSize:64, marginBottom:20 }}>📊</div>
      <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>Nicio dată încă</div>
      <div style={{ fontSize:14, color:'var(--text3)', textAlign:'center' }}>
        Adaugă tranzacții pentru a vedea statistici
      </div>
    </div>
  );

  return (
    <div className="page">
      <div style={{ fontWeight:800, fontSize:22, marginBottom:20, letterSpacing:'-0.5px' }}>Statistici</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
        <KpiCard label="Total cheltuit" value={fmt(totalAllTime)} color="var(--red)" />
        <KpiCard label="Medie lunară"   value={fmt(avgMonthly)}   color="var(--text)" />
        {maxTx && (
          <div className="glass anim-fade-up" style={{ gridColumn:'span 2', padding:'16px' }}>
            <div className="section-label" style={{ marginBottom:8 }}>Cea mai mare cheltuială</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:15 }}>
                  {maxTx.description || getCategoryById(maxTx.category).name}
                </div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>
                  {new Date(maxTx.date+'T00:00:00').toLocaleDateString('ro-RO',
                    { day:'numeric', month:'long', year:'numeric' })}
                </div>
              </div>
              <div style={{ fontWeight:800, fontSize:18, color:'var(--red)' }}>{fmt(maxTx.amount)}</div>
            </div>
          </div>
        )}
      </div>

      {pieData.length > 0 && (
        <div className="glass anim-fade-up" style={{ marginBottom:16, padding:'20px' }}>
          <div className="section-label">Cheltuieli luna curentă</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={3}
                onMouseEnter={(_, i) => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}>
                {pieData.map((e, i) => (
                  <Cell key={i} fill={e.color}
                    opacity={activeIdx === null || activeIdx === i ? 1 : 0.4} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<Tip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:4 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:3, background:d.color, flexShrink:0 }} />
                  <span style={{ fontSize:13, color:'var(--text2)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:600 }}>{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass anim-fade-up" style={{ marginBottom:16, padding:'20px' }}>
        <div className="section-label">Ultimele 6 luni</div>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={barData} barGap={3} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill:'var(--text3)', fontSize:12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:'var(--text3)', fontSize:11 }} axisLine={false} tickLine={false} width={44}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<Tip />} cursor={{ fill:'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="Venituri"   fill="var(--green)" radius={[6,6,0,0]} maxBarSize={28} />
            <Bar dataKey="Cheltuieli" fill="var(--red)"   radius={[6,6,0,0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:8 }}>
          {[['var(--green)','Venituri'],['var(--red)','Cheltuieli']].map(([c, l]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text2)' }}>
              <div style={{ width:10, height:10, borderRadius:3, background:c }} /> {l}
            </div>
          ))}
        </div>
      </div>

      {topCats.length > 0 && (
        <div className="glass anim-fade-up" style={{ marginBottom:8, padding:'20px' }}>
          <div className="section-label">Top categorii (total)</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {topCats.map((cat, i) => {
              const pct = totalAllTime > 0 ? (cat.sum / totalAllTime) * 100 : 0;
              return (
                <div key={cat.id}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--text3)', width:18 }}>#{i+1}</span>
                      <span style={{ fontSize:18 }}>{cat.icon}</span>
                      <span style={{ fontSize:14, fontWeight:600 }}>{cat.name}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:12, color:'var(--text3)' }}>{pct.toFixed(0)}%</span>
                      <span style={{ fontWeight:700, fontSize:14 }}>{fmt(cat.sum)}</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width:`${pct}%`, background:cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div className="glass anim-fade-up" style={{ padding:'16px' }}>
      <div className="section-label" style={{ marginBottom:6 }}>{label}</div>
      <div style={{ fontWeight:800, fontSize:16, color }}>{value}</div>
    </div>
  );
}
